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
});

test('le collecteur local respecte le déclencheur anti-doublon historique', () => {
  assert.match(localCollector, /\.update\(article\)\.eq\('id', id\)/);
  assert.match(localCollector, /#infodrop-pyrenees/);
  assert.doesNotMatch(localCollector, /\.upsert\(articles/);
});
