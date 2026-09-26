import {
  canonicalizeUrl,
  categorizeArticle,
  classifyTerritory,
  isWithinRollingWindow,
} from './territory.js';

export const FEED_HEADERS = {
  Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
  'User-Agent': 'Mozilla/5.0 (compatible; Infodrop/1.2; +https://infodrop.live/)',
};

const MAX_REJECTION_SAMPLES = 10;
const MAX_FRESHNESS_DAYS = 180;

export function cleanTitle(value = '') {
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

export function looksPaywalled(item = {}) {
  const value = `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''}`.toLowerCase();
  return ['réservé aux abonnés', 'article abonné', 'abonnez-vous', 'contenu réservé']
    .some((term) => value.includes(term));
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function itemDate(item = {}) {
  return item.isoDate || item.pubDate || null;
}

function categoryText(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (!value || typeof value !== 'object') return '';
  for (const candidate of [value._, value.term, value.name, value.label, value.$?.term, value.$?.label]) {
    if (typeof candidate === 'string' || typeof candidate === 'number') return String(candidate);
  }
  return '';
}

function toValidDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function latestIso(current, candidate) {
  if (!candidate) return current;
  if (!current || candidate.getTime() > new Date(current).getTime()) return candidate.toISOString();
  return current;
}

function rejectionSample(item, reason, publishedAt = null) {
  return {
    reason,
    title: cleanTitle(item.title || item.contentSnippet || 'Sans titre'),
    url: validHttpUrl(item.link) ? canonicalizeUrl(item.link) : null,
    published_at: publishedAt?.toISOString() || null,
  };
}

export function evaluateFeedQuality(items = [], now = new Date()) {
  const sample = items.slice(0, 20);
  const dates = sample.map((item) => toValidDate(itemDate(item))).filter(Boolean).sort((a, b) => b - a);
  const newest = dates[0] || null;
  const freshnessDays = newest ? Math.floor((now.getTime() - newest.getTime()) / 86_400_000) : null;
  const futureMinutes = newest ? Math.ceil((newest.getTime() - now.getTime()) / 60_000) : null;
  const titlesValid = sample.filter((item) => cleanTitle(item.title || item.contentSnippet).length > 0).length;
  const linksValid = sample.filter((item) => validHttpUrl(item.link)).length;
  const datesValid = dates.length;
  const passed = sample.length > 0
    && titlesValid === sample.length
    && linksValid === sample.length
    && datesValid === sample.length
    && freshnessDays !== null
    && freshnessDays <= MAX_FRESHNESS_DAYS
    && futureMinutes <= 5;

  return {
    passed,
    items_checked: sample.length,
    titles_valid: titlesValid,
    links_valid: linksValid,
    dates_valid: datesValid,
    newest_at: newest?.toISOString() || null,
    freshness_days: freshnessDays,
    future_minutes: futureMinutes,
    sample: sample[0] ? {
      title: cleanTitle(sample[0].title || sample[0].contentSnippet) || null,
      link: validHttpUrl(sample[0].link) ? sample[0].link : null,
      date: itemDate(sample[0]),
    } : null,
  };
}

export function processFeedItems(source, items = [], { now = new Date() } = {}) {
  const metrics = {
    items_fetched: items.length,
    items_in_24h: 0,
    items_rejected_territory: 0,
    items_rejected_invalid_date: 0,
    items_rejected_invalid_url: 0,
    items_duplicate: 0,
    items_written: 0,
    last_feed_item_at: null,
    last_qualified_item_at: null,
  };
  const articles = [];
  const rejections = [];
  const addRejection = (item, reason, publishedAt = null) => {
    if (rejections.length < MAX_REJECTION_SAMPLES) {
      rejections.push(rejectionSample(item, reason, publishedAt));
    }
  };

  for (const item of items) {
    const publishedAt = toValidDate(itemDate(item));
    if (publishedAt) metrics.last_feed_item_at = latestIso(metrics.last_feed_item_at, publishedAt);

    if (!publishedAt || publishedAt.getTime() > now.getTime() + 5 * 60 * 1000) {
      metrics.items_rejected_invalid_date += 1;
      addRejection(item, 'invalid_date', publishedAt);
      continue;
    }

    if (!isWithinRollingWindow(publishedAt, 24, now)) {
      addRejection(item, 'outside_24h', publishedAt);
      continue;
    }
    metrics.items_in_24h += 1;

    if (!validHttpUrl(item.link)) {
      metrics.items_rejected_invalid_url += 1;
      addRejection(item, 'invalid_url', publishedAt);
      continue;
    }

    const rssTags = (Array.isArray(item.categories) ? item.categories : [item.categories])
      .map(categoryText)
      .filter(Boolean);
    const candidate = {
      title: cleanTitle(item.title || item.contentSnippet),
      resume: cleanTitle(item.title || item.contentSnippet),
      url: item.link,
      tags: rssTags,
    };
    const territory = classifyTerritory(candidate, source);
    if (!territory.included) {
      metrics.items_rejected_territory += 1;
      addRejection(item, 'outside_territory', publishedAt);
      continue;
    }

    const canonicalUrl = canonicalizeUrl(item.link);
    const paywalled = looksPaywalled(item);
    const category = categorizeArticle(candidate);
    const tags = [...new Set(['pyrenees', 'local', category, ...(paywalled ? ['Abonné'] : [])])];
    metrics.last_qualified_item_at = latestIso(metrics.last_qualified_item_at, publishedAt);
    articles.push({
      title: candidate.title,
      resume: candidate.resume,
      source: source.name,
      url: canonicalUrl,
      canonical_url: canonicalUrl,
      heure: publishedAt.toISOString(),
      tags,
      edition_slug: 'pyrenees',
      territory_zone: territory.zone,
      display_zone: territory.displayZone,
      relevance_level: territory.relevance,
      locality: territory.locality,
      category,
      source_kind: source.source_type,
      source_slug: source.slug,
      is_paywalled: paywalled,
      ingested_at: now.toISOString(),
      dedupe_priority: Number(source.dedupe_priority || 0),
    });
  }

  return {
    articles,
    metrics,
    rejections,
    quality: evaluateFeedQuality(items, now),
  };
}
