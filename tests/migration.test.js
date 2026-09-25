import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(
  new URL('../supabase/migrations/202609250001_infodrop_pyrenees_v1.sql', import.meta.url),
  'utf8',
);

test('la migration régionale reste additive', () => {
  assert.doesNotMatch(migration, /\bdrop\s+(table|column|policy|function|view)\b/i);
  assert.doesNotMatch(migration, /\btruncate\b/i);
  assert.doesNotMatch(migration, /\bdelete\s+from\b/i);
});

test('la migration respecte le type texte historique des favoris', () => {
  assert.match(migration, /bookmarks\.article_id\s*=\s*actu\.id::text/);
});
