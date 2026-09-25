import { timingSafeEqual } from 'node:crypto';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import registry from '../public/config/sources-pyrenees.json' with { type: 'json' };
import {
  canonicalizeUrl,
  categorizeArticle,
  classifyTerritory,
  deduplicateArticles,
  isWithinRollingWindow,
} from '../lib/local/territory.js';

const parser = new Parser({
  timeout: 12_000,
});

const FEED_HEADERS = {
  Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
  'User-Agent': 'Mozilla/5.0 (compatible; Infodrop/1.0; +https://infodrop.live/)',
};

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

function cleanTitle(value = '') {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function looksPaywalled(item = {}) {
  const value = `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''}`.toLowerCase();
  return ['réservé aux abonnés', 'article abonné', 'abonnez-vous', 'contenu réservé']
    .some((term) => value.includes(term));
}

async function collectSource(source) {
  const startedAt = Date.now();
  try {
    const feed = await fetchFeed(source);
    const articles = [];
    for (const item of (feed.items || []).slice(0, 40)) {
      const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();
      if (!item.link || !isWithinRollingWindow(publishedAt)) continue;

      const candidate = {
        title: cleanTitle(item.title || item.contentSnippet),
        resume: cleanTitle(item.title || item.contentSnippet),
        url: item.link,
        source: source.name,
        tags: item.categories || [],
      };
      const territory = classifyTerritory(candidate, source);
      if (!territory.included) continue;

      const canonicalUrl = canonicalizeUrl(item.link);
      const paywalled = looksPaywalled(item);
      const category = categorizeArticle(candidate);
      const tags = [...new Set(['pyrenees', 'local', category, ...(paywalled ? ['Abonné'] : [])])];
      articles.push({
        resume: candidate.resume,
        source: source.name,
        url: canonicalUrl,
        canonical_url: canonicalUrl,
        heure: new Date(publishedAt).toISOString(),
        tags,
        edition_slug: 'pyrenees',
        territory_zone: territory.zone,
        locality: territory.locality,
        category,
        source_kind: source.source_type,
        source_slug: source.slug,
        is_paywalled: paywalled,
        ingested_at: new Date().toISOString(),
      });
    }

    return {
      source,
      status: 'ok',
      articles,
      duration_ms: Date.now() - startedAt,
      error_message: null,
    };
  } catch (error) {
    return {
      source,
      status: error.message?.toLowerCase().includes('timeout') ? 'timeout' : 'error',
      articles: [],
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
    default_locality: source.default_locality,
    requires_keyword: source.requires_keyword,
    language: source.language,
    automation: source.automation,
    verification: source.verification,
    active: source.active,
    registry_verified_at: registry.verified_at,
    updated_at: new Date().toISOString(),
  };
}

async function persistArticles(supabase, articles) {
  if (articles.length === 0) return { inserted: 0, updated: 0, written: 0, error: null };

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
      updates.push({ id: localRow.id, article: { ...article, url: localRow.url } });
      continue;
    }

    const url = matches.length > 0
      ? `${article.canonical_url}#infodrop-pyrenees`
      : article.url;
    inserts.push({ ...article, url });
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
  const updated = updateResults.reduce((count, result) => count + (result.data?.length || 0), 0);
  return { inserted, updated, written: inserted + updated, error: null };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  if (!authorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(503).json({ error: 'Configuration Supabase manquante' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const selectedSlug = typeof req.query?.source === 'string' ? req.query.source : null;
  const sources = registry.sources.filter((source) => source.active && source.automation === 'rss' && (!selectedSlug || source.slug === selectedSlug));
  if (selectedSlug && sources.length === 0) {
    return res.status(404).json({ error: 'Source active introuvable' });
  }

  const registryWrite = await supabase.from('regional_sources').upsert(sources.map(sourceRow), { onConflict: 'slug' });
  if (registryWrite.error) {
    return res.status(503).json({
      error: 'Migration régionale requise avant la collecte',
      schema_ready: false,
    });
  }

  const startedAt = Date.now();
  const results = await Promise.all(sources.map(collectSource));
  const articles = deduplicateArticles(results.flatMap((result) => result.articles));
  const articleWrite = await persistArticles(supabase, articles);
  if (articleWrite.error) {
    return res.status(500).json({ error: 'Échec d’écriture des articles régionaux', details: articleWrite.error.message });
  }

  const checkedAt = new Date().toISOString();
  const checks = results.map((result) => ({
    source_slug: result.source.slug,
    checked_at: checkedAt,
    status: result.status,
    response_ms: result.duration_ms,
    articles_seen: result.articles.length,
    error_message: result.error_message,
  }));
  await supabase.from('regional_source_checks').insert(checks);

  await Promise.all(results.map((result) => {
    const update = {
      last_checked_at: checkedAt,
      last_status: result.status,
      last_error: result.error_message,
    };
    if (result.status === 'ok') update.last_success_at = checkedAt;
    return supabase
      .from('regional_sources')
      .update(update)
      .eq('slug', result.source.slug);
  }));

  return res.status(200).json({
    success: true,
    edition: 'pyrenees',
    sources_checked: results.length,
    sources_ok: results.filter((result) => result.status === 'ok').length,
    sources_failed: results.filter((result) => result.status !== 'ok').length,
    articles_qualified: articles.length,
    articles_inserted: articleWrite.inserted,
    articles_updated: articleWrite.updated,
    articles_upserted: articleWrite.written,
    duration_ms: Date.now() - startedAt,
    results: results.map((result) => ({
      source: result.source.name,
      status: result.status,
      articles: result.articles.length,
      duration_ms: result.duration_ms,
    })),
  });
}
