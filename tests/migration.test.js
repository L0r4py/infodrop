import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(
  new URL('../supabase/migrations/202609250001_infodrop_pyrenees_v1.sql', import.meta.url),
  'utf8',
);
const statsMigration = await readFile(
  new URL('../supabase/migrations/202609260001_infodrop_edition_stats.sql', import.meta.url),
  'utf8',
);
const observabilityMigration = await readFile(
  new URL('../supabase/migrations/202609270001_infodrop_pyrenees_observability.sql', import.meta.url),
  'utf8',
);

test('la migration régionale reste additive', () => {
  for (const sql of [migration, statsMigration, observabilityMigration]) {
    assert.doesNotMatch(sql, /\bdrop\s+(table|column|policy|function|view)\b/i);
    assert.doesNotMatch(sql, /\btruncate\b/i);
    assert.doesNotMatch(sql, /\bdelete\s+from\b/i);
  }
});

test('la migration respecte le type texte historique des favoris', () => {
  assert.match(migration, /bookmarks\.article_id\s*=\s*actu\.id::text/);
});

test('les statistiques par édition n’altèrent pas la fonction historique', () => {
  assert.match(statsMigration, /create or replace function public\.get_edition_stats/);
  assert.doesNotMatch(statsMigration, /create or replace function public\.get_live_stats/);
  assert.match(statsMigration, /edition_slug\s*=\s*p_edition_slug/);
});

test('la migration d’observabilité expose les compteurs et les sources H24', () => {
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
    assert.match(observabilityMigration, new RegExp(metric), metric);
  }
  assert.match(observabilityMigration, /get_edition_source_stats/);
  assert.match(observabilityMigration, /active_zones/);
});
