import Parser from 'rss-parser';
import registry from '../public/config/sources-pyrenees.json' with { type: 'json' };
import candidateRegistry from '../config/source-candidates-pyrenees.json' with { type: 'json' };
import { FEED_HEADERS, processFeedItems } from '../lib/local/feed.js';
import { deduplicateArticlesWithMetrics } from '../lib/local/territory.js';

const parser = new Parser();
const TIMEOUT_MS = 12_000;
const RUNS_PER_SOURCE = 2;

async function inspectOnce(source) {
  const startedAt = Date.now();
  try {
    const response = await fetch(source.feed_url, {
      redirect: 'follow',
      headers: FEED_HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const feed = await parser.parseString(await response.text());
    const processed = processFeedItems(source, feed.items || []);
    const deduplicated = deduplicateArticlesWithMetrics(processed.articles);
    processed.metrics.items_duplicate = deduplicated.duplicatesBySource[source.slug] || 0;
    return {
      ok: processed.quality.passed,
      http_status: response.status,
      final_url: response.url,
      content_type: response.headers.get('content-type'),
      duration_ms: Date.now() - startedAt,
      quality: processed.quality,
      metrics: processed.metrics,
      error: processed.quality.passed ? null : 'Un ou plusieurs contrôles de contenu ont échoué',
    };
  } catch (error) {
    return {
      ok: false,
      duration_ms: Date.now() - startedAt,
      error: String(error?.message || error),
    };
  }
}

async function verifySource(source) {
  const attempts = [];
  for (let attempt = 0; attempt < RUNS_PER_SOURCE; attempt += 1) {
    attempts.push(await inspectOnce(source));
  }
  return {
    slug: source.slug,
    name: source.name,
    feed_url: source.feed_url,
    replaces_slug: source.replaces_slug || null,
    passed: attempts.every((attempt) => attempt.ok),
    attempts,
  };
}

const candidateMode = process.argv.includes('--candidates');
const requestedSlug = process.argv.find((argument) => argument.startsWith('--source='))?.split('=')[1];
const sourcePool = candidateMode
  ? candidateRegistry.sources
  : registry.sources.filter((source) => source.active && source.automation === 'rss');
const sources = requestedSlug
  ? sourcePool.filter((source) => source.slug === requestedSlug)
  : sourcePool;

if (requestedSlug && sources.length === 0) {
  console.error(`Source introuvable dans le lot ${candidateMode ? 'candidat' : 'actif'} : ${requestedSlug}`);
  process.exit(2);
}

const results = await Promise.all(sources.map(verifySource));
const summary = {
  checked_at: new Date().toISOString(),
  mode: candidateMode ? 'candidates' : 'active',
  runs_per_source: RUNS_PER_SOURCE,
  timeout_ms: TIMEOUT_MS,
  sources_checked: results.length,
  sources_passed: results.filter((result) => result.passed).length,
  sources_failed: results.filter((result) => !result.passed).length,
  results,
};

console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.sources_failed === 0 ? 0 : 1;
