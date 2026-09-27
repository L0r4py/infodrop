import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const nationalCollector = await readFile(new URL('../api/parse-rss.js', import.meta.url), 'utf8');
const localCollector = await readFile(new URL('../api/parse-local-rss.js', import.meta.url), 'utf8');

test('le collecteur national renseigne les colonnes communes sans effacer leur sens', () => {
  assert.match(nationalCollector, /canonical_url:\s*item\.link/);
  assert.match(nationalCollector, /edition_slug:\s*'national'/);
  assert.match(nationalCollector, /source_kind:\s*'rss'/);
  assert.match(nationalCollector, /is_paywalled:\s*isPaywalled/);
});

test('le collecteur local utilise la même lecture HTTP robuste que la vérification', () => {
  assert.match(localCollector, /Accept:\s*'application\/rss\+xml/);
  assert.match(localCollector, /AbortSignal\.timeout\(12_000\)/);
  assert.match(localCollector, /parser\.parseString/);
  assert.match(localCollector, /attempt\s*=\s*0;\s*attempt\s*<\s*2/);
});

test('le collecteur local respecte le déclencheur anti-doublon historique', () => {
  assert.match(localCollector, /\.update\(article\)\.eq\('id', id\)/);
  assert.match(localCollector, /#infodrop-pyrenees/);
  assert.doesNotMatch(localCollector, /\.upsert\(articles/);
});

test('le collecteur local ne publie pas les catégories RSS brutes comme filtres', () => {
  assert.match(localCollector, /new Set\(\['pyrenees', 'local', category,/);
  assert.doesNotMatch(localCollector, /category, \.\.\.\(item\.categories/);
});

test('le collecteur local rejette les dates absentes et expose le diagnostic par source', () => {
  assert.match(localCollector, /parseItemPublicationDate/);
  assert.doesNotMatch(localCollector, /item\.isoDate\s*\|\|\s*item\.pubDate\s*\|\|\s*new Date/);
  for (const metric of [
    'items_fetched',
    'items_in_24h',
    'items_rejected_invalid_date',
    'items_duplicate',
    'items_written',
    'last_feed_item_at',
    'last_qualified_item_at',
  ]) {
    assert.match(localCollector, new RegExp(metric), metric);
  }
});

test('le mode probe vérifie une source inactive sans écrire en base', () => {
  assert.match(localCollector, /probeMode/);
  assert.match(localCollector, /probe:\s*true/);
});

test('le collecteur accepte le périmètre du flux et ne déduit jamais la zone du texte', async () => {
  assert.doesNotMatch(localCollector, /classifyTerritory|requires_keyword|items_rejected_territory/);
  const { collectSource } = await import('../api/parse-local-rss.js');
  const originalFetch = globalThis.fetch;
  const published = new Date(Date.now() - 3600000).toUTCString();
  globalThis.fetch = async () => new Response(`<rss version="2.0"><channel><title>Local</title><item><title>Un conseil jeudi à Montpellier</title><link>https://example.org/item</link><pubDate>${published}</pubDate></item><item><title>Sans date</title><link>https://example.org/missing</link></item></channel></rss>`);
  try {
    const result = await collectSource({ name: 'Rubrique locale', slug: 'test', default_zone: 'barousse', default_locality: 'Barousse' });
    assert.equal(result.articles.length, 1);
    assert.equal(result.articles[0].territory_zone, 'barousse');
    assert.equal(result.metrics.items_rejected_invalid_date, 1);
  } finally { globalThis.fetch = originalFetch; }
});
