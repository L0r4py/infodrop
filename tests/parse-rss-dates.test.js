import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY ||= 'test-service-key';

const { parseItemPublicationDate } = await import('../api/parse-rss.js');
const nationalCollector = await readFile(new URL('../api/parse-rss.js', import.meta.url), 'utf8');

test('préfère isoDate puis utilise pubDate si nécessaire', () => {
  const isoDate = '2026-09-26T20:15:00Z';
  const pubDate = 'Sat, 26 Sep 2026 19:00:00 GMT';

  assert.equal(
    parseItemPublicationDate({ isoDate, pubDate }).toISOString(),
    '2026-09-26T20:15:00.000Z',
  );
  assert.equal(
    parseItemPublicationDate({ isoDate: 'invalide', pubDate }).toISOString(),
    '2026-09-26T19:00:00.000Z',
  );
});

test('accepte les autres champs de date usuels réellement présents', () => {
  for (const field of ['date', 'published', 'updated', 'created', 'dc:date']) {
    const parsed = parseItemPublicationDate({ [field]: '2026-09-26T18:30:00Z' });
    assert.equal(parsed.toISOString(), '2026-09-26T18:30:00.000Z', field);
  }
});

test('rejette un item sans date valide au lieu de lui attribuer maintenant', () => {
  assert.equal(parseItemPublicationDate({ title: 'Sans date' }), null);
  assert.equal(parseItemPublicationDate({ isoDate: 'invalide', pubDate: '' }), null);
  assert.doesNotMatch(nationalCollector, /new Date\(now\)/);
  assert.match(nationalCollector, /if \(!pubDate \|\| pubDate > now\)/);
});
