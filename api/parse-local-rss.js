import { timingSafeEqual } from 'node:crypto';
import Parser from 'rss-parser';
import { isAutomaticWeatherBulletin } from '../lib/local/weather-bulletins.js';
import { createClient } from '@supabase/supabase-js';
import registry from '../public/config/sources-pyrenees.json' with { type: 'json' };
import {
  canonicalizeUrl,
  categorizeArticle,
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

const ITEM_DATE_FIELDS = ['isoDate', 'pubDate', 'date', 'published', 'updated', 'created', 'dc:date'];

export function parseItemPublicationDate(item = {}) {
  for (const field of ITEM_DATE_FIELDS) {
    const value = item[field];
    if (!value) continue;
    const parsed = new Date(value);
    if (Number.isFinite(parsed.getTime())) return parsed;
  }
  return null;
}

function normalizeCategories(categories = []) {
  return (Array.isArray(categories) ? categories : [categories])
    .map((category) => (
      typeof category === 'string'
        ? category
        : category?._ || category?.name || category?.label || ''
    ))
    .map((category) => String(category).trim())
    .filter(Boolean);
}

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

export async function collectSource(source) {
  const startedAt = Date.now();
  try {
    const feed = await fetchFeed(source);
    const items = feed.items || [];
    const qualifiedArticles = [];
    const metrics = {
      items_fetched: items.length,
      items_in_24h: 0,
      items_rejected_invalid_date: 0,
      items_duplicate: 0,
      items_written: 0,
      last_feed_item_at: null,
      last_qualified_item_at: null,
    };
    const now = new Date();

    for (const item of items) {
      const publishedAt = parseItemPublicationDate(item);
      if (!publishedAt || publishedAt.getTime() > now.getTime() + 5 * 60 * 1000) {
        metrics.items_rejected_invalid_date += 1;
        continue;
      }
      if (!metrics.last_feed_item_at || publishedAt > new Date(metrics.last_feed_item_at)) {
        metrics.last_feed_item_at = publishedAt.toISOString();
      }
      if (!isWithinRollingWindow(publishedAt, 24, now)) continue;
      metrics.items_in_24h += 1;
      if (!item.link) continue;
      if (isAutomaticWeatherBulletin(cleanTitle(item.title || item.contentSnippet))) continue;

      const candidate = {
        title: cleanTitle(item.title || item.contentSnippet),
        resume: cleanTitle(item.title || item.contentSnippet),
        url: item.link,
        source: source.name,
        tags: normalizeCategories(item.categories),
      };
      const canonicalUrl = canonicalizeUrl(item.link);
      const paywalled = looksPaywalled(item);
      const category = categorizeArticle(candidate);
      const tags = [...new Set(['pyrenees', 'local', category, ...(paywalled ? ['Abonné'] : [])])];
      qualifiedArticles.push({
        resume: candidate.resume,
        source: source.name,
        url: canonicalUrl,
        canonical_url: canonicalUrl,
        heure: publishedAt.toISOString(),
        tags,
        edition_slug: 'pyrenees',
        territory_zone: source.default_zone,
        locality: source.default_locality || null,
        category,
        source_kind: source.source_type,
        source_slug: source.slug,
        source_priority: Number(source.priority || 0),
        is_paywalled: paywalled,
        ingested_at: new Date().toISOString(),
      });
      if (!metrics.last_qualified_item_at || publishedAt > new Date(metrics.last_qualified_item_at)) {
        metrics.last_qualified_item_at = publishedAt.toISOString();
      }
    }

    const articles = deduplicateArticles(qualifiedArticles);
    metrics.items_duplicate = qualifiedArticles.length - articles.length;

    return {
      source,
      status: 'ok',
      articles,
      duration_ms: Date.now() - startedAt,
      error_message: null,
      metrics,
    };
  } catch (error) {
    return {
      source,
      status: error.message?.toLowerCase().includes('timeout') ? 'timeout' : 'error',
      articles: [],
      duration_ms: Date.now() - startedAt,
      error_message: String(error.message || 'Erreur de lecture').slice(0, 500),
      metrics: {
        items_fetched: 0,
        items_in_24h: 0,
        items_rejected_invalid_date: 0,
        items_duplicate: 0,
        items_written: 0,
        last_feed_item_at: null,
        last_qualified_item_at: null,
      },
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
    language: source.language,
    automation: source.automation,
    verification: source.verification,
    active: source.active,
    registry_verified_at: registry.verified_at,
    updated_at: new Date().toISOString(),
  };
}

async function persistArticles(supabase, articles) {
  if (articles.length === 0) return { inserted: 0, updated: 0, written: 0, written_by_source: {}, error: null };

  const persistableArticles = articles.map(({ source_priority: _priority, ...article }) => article);
  const canonicalUrls = [...new Set(persistableArticles.map((article) => article.canonical_url))];
  // Plusieurs rubriques peuvent fournir assez d'URL pour dépasser la taille d'une requête HTTP.
  const lookups = [];
  for (let offset = 0; offset < canonicalUrls.length; offset += 25) {
    const urls = canonicalUrls.slice(offset, offset + 25);
    lookups.push(...await Promise.all([
      supabase.from('actu').select('id,url,canonical_url,edition_slug').in('canonical_url', urls),
      supabase.from('actu').select('id,url,canonical_url,edition_slug').in('url', urls),
    ]));
  }
  const lookupError = lookups.find(result => result.error)?.error;
  if (lookupError) return { error: lookupError };

  const existing = [...new Map(
    lookups.flatMap(result => result.data || []).map((row) => [row.id, row]),
  ).values()];
  const updates = [];
  const inserts = [];

  for (const article of persistableArticles) {
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
  const writtenBySource = {};
  [...updates.map(({ article }) => article), ...inserts].forEach((article) => {
    writtenBySource[article.source_slug] = (writtenBySource[article.source_slug] || 0) + 1;
  });
  return { inserted, updated, written: inserted + updated, written_by_source: writtenBySource, error: null };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  if (!authorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  const selectedSlugs = typeof req.query?.source === 'string' ? req.query.source.split(',').filter(Boolean) : [];
  const probeMode = req.query?.probe === '1' || req.query?.probe === 'true';
  if (probeMode && !selectedSlugs.length) {
    return res.status(400).json({ error: 'Le mode probe exige un paramètre source' });
  }
  const sources = registry.sources.filter((source) => (
    source.automation === 'rss'
    && (probeMode || source.active)
    && (!selectedSlugs.length || selectedSlugs.includes(source.slug))
  ));
  if (selectedSlugs.length && sources.length !== new Set(selectedSlugs).size) {
    return res.status(404).json({ error: 'Source RSS introuvable' });
  }

  const startedAt = Date.now();
  const results = await Promise.all(sources.map(collectSource));
  const collectedArticles = results.flatMap((result) => result.articles);
  const articles = deduplicateArticles(collectedArticles);
  const keptArticles = new Set(articles);
  results.forEach((result) => {
    result.metrics.items_duplicate += result.articles.filter((article) => !keptArticles.has(article)).length;
  });

  if (probeMode) {
    return res.status(200).json({
      success: results.every((result) => result.status === 'ok'),
      probe: true,
      edition: 'pyrenees',
      sources_checked: results.length,
      sources_ok: results.filter((result) => result.status === 'ok').length,
      sources_failed: results.filter((result) => result.status !== 'ok').length,
      articles_qualified: articles.length,
      duration_ms: Date.now() - startedAt,
      results: results.map((result) => ({
        source: result.source.name,
        slug: result.source.slug,
        status: result.status,
        duration_ms: result.duration_ms,
        ...result.metrics,
        error_message: result.error_message,
      })),
    });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(503).json({ error: 'Configuration Supabase manquante' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Synchroniser aussi les sources retirées du flux actif conserve leur historique
  // tout en empêchant qu'un ancien état `active = true` persiste en base.
  const registryWrite = await supabase.from('regional_sources').upsert(registry.sources.map(sourceRow), { onConflict: 'slug' });
  if (registryWrite.error) {
    return res.status(503).json({
      error: 'Migration régionale requise avant la collecte',
      schema_ready: false,
    });
  }

  const articleWrite = await persistArticles(supabase, articles);
  if (articleWrite.error) {
    return res.status(500).json({ error: 'Échec d’écriture des articles régionaux', details: articleWrite.error.message });
  }
  results.forEach((result) => {
    result.metrics.items_written = articleWrite.written_by_source[result.source.slug] || 0;
    result.metrics.last_qualified_item_at = articles
      .filter(article => article.source_slug === result.source.slug)
      .map(article => article.heure).sort().at(-1) || null;
  });

  const checkedAt = new Date().toISOString();
  const checks = results.map((result) => ({
    source_slug: result.source.slug,
    checked_at: checkedAt,
    status: result.status,
    response_ms: result.duration_ms,
    articles_seen: result.metrics.items_fetched,
    items_fetched: result.metrics.items_fetched,
    items_in_24h: result.metrics.items_in_24h,
    items_rejected_invalid_date: result.metrics.items_rejected_invalid_date,
    items_duplicate: result.metrics.items_duplicate,
    items_written: result.metrics.items_written,
    last_feed_item_at: result.metrics.last_feed_item_at,
    last_qualified_item_at: result.metrics.last_qualified_item_at,
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
      slug: result.source.slug,
      status: result.status,
      articles: result.articles.length,
      duration_ms: result.duration_ms,
      ...result.metrics,
    })),
  });
}
