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
const correctiveMigration = await readFile(
  new URL('../supabase/migrations/202609260002_infodrop_pyrenees_correctifs.sql', import.meta.url),
  'utf8',
);

test('la migration régionale reste additive', () => {
  for (const sql of [migration, statsMigration, correctiveMigration]) {
    assert.doesNotMatch(sql, /\bdrop\s+(table|column|policy|function|view)\b/i);
    assert.doesNotMatch(sql, /\btruncate\b/i);
    assert.doesNotMatch(sql, /\bdelete\s+from\b/i);
  }
});

test('la migration corrective ajoute zones publiques et compteurs par source', () => {
  assert.match(correctiveMigration, /add column if not exists display_zone/);
  assert.match(correctiveMigration, /add column if not exists relevance_level/);
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
    assert.match(correctiveMigration, new RegExp(metric));
  }
});

test('les derniers refus restent dans une table privée', () => {
  assert.match(correctiveMigration, /create table if not exists public\.regional_source_diagnostics/);
  assert.match(correctiveMigration, /regional_source_diagnostics enable row level security/);
  assert.match(correctiveMigration, /revoke all on table public\.regional_source_diagnostics from anon, authenticated/);
  assert.doesNotMatch(correctiveMigration, /create policy[\s\S]+regional_source_diagnostics/i);
});

test('la migration respecte le type texte historique des favoris', () => {
  assert.match(migration, /bookmarks\.article_id\s*=\s*actu\.id::text/);
});

test('les statistiques par édition n’altèrent pas la fonction historique', () => {
  assert.match(statsMigration, /create or replace function public\.get_edition_stats/);
  assert.doesNotMatch(statsMigration, /create or replace function public\.get_live_stats/);
  assert.match(statsMigration, /edition_slug\s*=\s*p_edition_slug/);
});
