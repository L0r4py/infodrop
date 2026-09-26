import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const nationalCollector = await readFile(new URL('../api/parse-rss.js', import.meta.url), 'utf8');
const localCollector = await readFile(new URL('../api/parse-local-rss.js', import.meta.url), 'utf8');
const feedProcessor = await readFile(new URL('../lib/local/feed.js', import.meta.url), 'utf8');

test('le collecteur national renseigne les colonnes communes sans effacer leur sens', () => {
  assert.match(nationalCollector, /canonical_url:\s*item\.link/);
  assert.match(nationalCollector, /edition_slug:\s*'national'/);
  assert.match(nationalCollector, /source_kind:\s*'rss'/);
  assert.match(nationalCollector, /is_paywalled:\s*isPaywalled/);
});

test('le collecteur local utilise la même lecture HTTP robuste que la vérification', () => {
  assert.match(feedProcessor, /Accept:\s*'application\/rss\+xml/);
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
  assert.match(feedProcessor, /new Set\(\['pyrenees', 'local', category,/);
  assert.doesNotMatch(feedProcessor, /category, \.\.\.\(item\.categories/);
});

test('le collecteur expose les compteurs qui distinguent flux vide et rejet territorial', () => {
  for (const metric of [
    'items_fetched',
    'items_in_24h',
    'items_rejected_territory',
    'items_rejected_invalid_date',
    'items_duplicate',
    'items_written',
    'last_feed_item_at',
    'last_qualified_item_at',
  ]) {
    assert.match(localCollector, new RegExp(metric));
  }
});

test('un candidat peut être vérifié depuis Vercel sans être activé ni écrit en base', () => {
  assert.match(localCollector, /candidate-probe/);
  assert.match(localCollector, /candidateRegistry\.sources\.find/);
  assert.match(localCollector, /if \(candidateSlug\) return runCandidateProbe/);
});
