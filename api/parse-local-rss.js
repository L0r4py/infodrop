import { timingSafeEqual } from 'node:crypto';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import registry from '../public/config/sources-pyrenees.json' with { type: 'json' };
import candidateRegistry from '../config/source-candidates-pyrenees.json' with { type: 'json' };
import { FEED_HEADERS, processFeedItems } from '../lib/local/feed.js';
import { deduplicateArticlesWithMetrics } from '../lib/local/territory.js';

const parser = new Parser({ timeout: 12_000 });

async function fetchFeed(source) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(source.feed_url, {
        redirect: 'follow',
        headers: FEED_HEADERS,
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`HTTP ${response.status}`);
      }
      return parser.parseString(await response.text());
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function authorized(req) {
  const secret = process.env.CRON_SECRET || '';
  const provided = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  return secret.length > 0
    && expectedBuffer.length === providedBuffer.length
    && timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function collectSource(source, now = new Date()) {
  const startedAt = Date.now();
  try {
    const feed = await fetchFeed(source);
    const processed = processFeedItems(source, feed.items || [], { now });
    return {
      source,
      status: 'ok',
      ...processed,
      duration_ms: Date.now() - startedAt,
      error_message: null,
    };
  } catch (error) {
    return {
      source,
      status: error.message?.toLowerCase().includes('timeout') ? 'timeout' : 'error',
      articles: [],
      metrics: {
        items_fetched: 0,
        items_in_24h: 0,
        items_rejected_territory: 0,
        items_rejected_invalid_date: 0,
        items_rejected_invalid_url: 0,
        items_duplicate: 0,
        items_written: 0,
        last_feed_item_at: null,
        last_qualified_item_at: null,
      },
      quality: { passed: false, items_checked: 0 },
      rejections: [],
      duration_ms: Date.now() - startedAt,
      error_message: String(error.message || 'Erreur de lecture').slice(0, 500),
    };
  }
}

function sourceRow(source) {
  return {
    slug: source.slug,
    name: source.name,
    publisher: source.publisher,
    homepage_url: source.homepage_url,
    feed_url: source.feed_url,
    source_type: source.source_type,
    scope: source.scope,
    default_zone: source.default_zone,
    default_display_zone: source.default_display_zone,
    default_locality: source.default_locality,
    territory_policy: source.territory_policy,
    dedupe_priority: source.dedupe_priority || 0,
    requires_keyword: source.requires_keyword,
    language: source.language,
    automation: source.automation,
    verification: source.verification,
    active: source.active,
    registry_verified_at: registry.verified_at,
    updated_at: new Date().toISOString(),
  };
}

function databaseArticle(article) {
  const { title: _title, dedupe_priority: _priority, ...row } = article;
  return row;
}

function incrementSourceCount(counts, sourceSlug) {
  counts[sourceSlug] = (counts[sourceSlug] || 0) + 1;
}

async function persistArticles(supabase, articles) {
  if (articles.length === 0) {
    return { inserted: 0, updated: 0, written: 0, writtenBySource: {}, error: null };
  }

  const canonicalUrls = [...new Set(articles.map((article) => article.canonical_url))];
  const [canonicalLookup, urlLookup] = await Promise.all([
    supabase.from('actu').select('id,url,canonical_url,edition_slug').in('canonical_url', canonicalUrls),
    supabase.from('actu').select('id,url,canonical_url,edition_slug').in('url', canonicalUrls),
  ]);
  if (canonicalLookup.error || urlLookup.error) {
    return { error: canonicalLookup.error || urlLookup.error };
  }

  const existing = [...new Map(
    [...(canonicalLookup.data || []), ...(urlLookup.data || [])].map((row) => [row.id, row]),
  ).values()];
  const updates = [];
  const inserts = [];

  for (const article of articles) {
    const matches = existing.filter((row) => (
      row.canonical_url === article.canonical_url || row.url === article.canonical_url
    ));
    const localRow = matches.find((row) => row.edition_slug === 'pyrenees');
    if (localRow) {
      updates.push({ id: localRow.id, article: { ...databaseArticle(article), url: localRow.url } });
      continue;
    }

    const url = matches.length > 0
      ? `${article.canonical_url}#infodrop-pyrenees`
      : article.url;
    inserts.push({ ...databaseArticle(article), url });
  }

  const updateResults = await Promise.all(updates.map(({ id, article }) => (
    supabase.from('actu').update(article).eq('id', id).select('id')
  )));
  const updateError = updateResults.find((result) => result.error)?.error;
  if (updateError) return { error: updateError };

  let inserted = 0;
  if (inserts.length > 0) {
    const insertResult = await supabase.from('actu').insert(inserts).select('id');
    if (insertResult.error) return { error: insertResult.error };
    inserted = insertResult.data?.length || 0;
  }

  const writtenBySource = {};
  inserts.forEach((article) => incrementSourceCount(writtenBySource, article.source_slug));
  updates.forEach(({ article }, index) => {
    if ((updateResults[index].data?.length || 0) > 0) {
      incrementSourceCount(writtenBySource, article.source_slug);
    }
  });
  const updated = updateResults.reduce((count, result) => count + (result.data?.length || 0), 0);
  return { inserted, updated, written: inserted + updated, writtenBySource, error: null };
}

function publicResult(result) {
  return {
    source_slug: result.source.slug,
    source: result.source.name,
    status: result.status,
    duration_ms: result.duration_ms,
    error_message: result.error_message,
    ...result.metrics,
    rejections: result.rejections,
  };
}

async function runCandidateProbe(req, res, candidateSlug) {
  const source = candidateRegistry.sources.find((candidate) => candidate.slug === candidateSlug);
  if (!source) return res.status(404).json({ error: 'Source candidate introuvable' });

  const result = await collectSource(source);
  const deduplicated = deduplicateArticlesWithMetrics(result.articles);
  result.metrics.items_duplicate = deduplicated.duplicatesBySource[source.slug] || 0;
  const verificationPassed = result.status === 'ok' && result.quality.passed;
  return res.status(verificationPassed ? 200 : 422).json({
    success: verificationPassed,
    mode: 'candidate-probe',
    edition: 'pyrenees',
    verification_passed: verificationPassed,
    quality: result.quality,
    result: publicResult(result),
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  if (!authorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const candidateSlug = typeof req.query?.candidate === 'string' ? req.query.candidate : null;
  if (candidateSlug) return runCandidateProbe(req, res, candidateSlug);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(503).json({ error: 'Configuration Supabase manquante' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const selectedSlug = typeof req.query?.source === 'string' ? req.query.source : null;
  const sources = registry.sources.filter((source) => (
    source.active
    && source.automation === 'rss'
    && (!selectedSlug || source.slug === selectedSlug)
  ));
  if (selectedSlug && sources.length === 0) {
    return res.status(404).json({ error: 'Source active introuvable' });
  }

  // Synchroniser aussi les sources retirées du flux actif conserve leur historique
  // tout en empêchant qu'un ancien état `active = true` persiste en base.
  const registryWrite = await supabase.from('regional_sources')
    .upsert(registry.sources.map(sourceRow), { onConflict: 'slug' });
  if (registryWrite.error) {
    return res.status(503).json({
      error: 'Migration régionale requise avant la collecte',
      schema_ready: false,
      details: registryWrite.error.message,
    });
  }

  const startedAt = Date.now();
  const results = await Promise.all(sources.map((source) => collectSource(source)));
  const deduplicated = deduplicateArticlesWithMetrics(results.flatMap((result) => result.articles));
  results.forEach((result) => {
    result.metrics.items_duplicate = deduplicated.duplicatesBySource[result.source.slug] || 0;
  });

  const articleWrite = await persistArticles(supabase, deduplicated.articles);
  if (articleWrite.error) {
    return res.status(500).json({
      error: 'Échec d’écriture des articles régionaux',
      details: articleWrite.error.message,
    });
  }
  results.forEach((result) => {
    result.metrics.items_written = articleWrite.writtenBySource[result.source.slug] || 0;
  });

  const checkedAt = new Date().toISOString();
  const checks = results.map((result) => ({
    source_slug: result.source.slug,
    checked_at: checkedAt,
    status: result.status,
    response_ms: result.duration_ms,
    articles_seen: result.articles.length,
    items_fetched: result.metrics.items_fetched,
    items_in_24h: result.metrics.items_in_24h,
    items_rejected_territory: result.metrics.items_rejected_territory,
    items_rejected_invalid_date: result.metrics.items_rejected_invalid_date,
    items_rejected_invalid_url: result.metrics.items_rejected_invalid_url,
    items_duplicate: result.metrics.items_duplicate,
    items_written: result.metrics.items_written,
    last_feed_item_at: result.metrics.last_feed_item_at,
    last_qualified_item_at: result.metrics.last_qualified_item_at,
    error_message: result.error_message,
  }));
  const checksWrite = await supabase.from('regional_source_checks').insert(checks);
  if (checksWrite.error) {
    return res.status(500).json({ error: 'Échec d’écriture du diagnostic des sources' });
  }

  const diagnosticRows = results.map((result) => ({
    source_slug: result.source.slug,
    checked_at: checkedAt,
    rejections: result.rejections,
    updated_at: checkedAt,
  }));
  const diagnosticsWrite = await supabase.from('regional_source_diagnostics')
    .upsert(diagnosticRows, { onConflict: 'source_slug' });
  if (diagnosticsWrite.error) {
    return res.status(500).json({ error: 'Échec d’écriture des derniers refus par source' });
  }

  await Promise.all(results.map((result) => {
    const update = {
      last_checked_at: checkedAt,
      last_status: result.status,
      last_error: result.error_message,
      last_items_fetched: result.metrics.items_fetched,
      last_items_in_24h: result.metrics.items_in_24h,
      last_items_rejected_territory: result.metrics.items_rejected_territory,
      last_items_rejected_invalid_date: result.metrics.items_rejected_invalid_date,
      last_items_duplicate: result.metrics.items_duplicate,
      last_items_written: result.metrics.items_written,
      last_feed_item_at: result.metrics.last_feed_item_at,
      last_qualified_item_at: result.metrics.last_qualified_item_at,
    };
    if (result.status === 'ok') update.last_success_at = checkedAt;
    return supabase.from('regional_sources').update(update).eq('slug', result.source.slug);
  }));

  return res.status(200).json({
    success: true,
    edition: 'pyrenees',
    sources_checked: results.length,
    sources_ok: results.filter((result) => result.status === 'ok').length,
    sources_failed: results.filter((result) => result.status !== 'ok').length,
    items_fetched: results.reduce((sum, result) => sum + result.metrics.items_fetched, 0),
    items_in_24h: results.reduce((sum, result) => sum + result.metrics.items_in_24h, 0),
    items_rejected_territory: results.reduce((sum, result) => sum + result.metrics.items_rejected_territory, 0),
    items_rejected_invalid_date: results.reduce((sum, result) => sum + result.metrics.items_rejected_invalid_date, 0),
    items_duplicate: results.reduce((sum, result) => sum + result.metrics.items_duplicate, 0),
    articles_qualified: deduplicated.articles.length,
    articles_inserted: articleWrite.inserted,
    articles_updated: articleWrite.updated,
    articles_upserted: articleWrite.written,
    duration_ms: Date.now() - startedAt,
    results: results.map(publicResult),
  });
}
