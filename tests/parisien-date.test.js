import test from 'node:test';
import assert from 'node:assert/strict';
import { parisienUrlDate, parisienPageDate, resolveParisienDate } from '../lib/parisien-date.js';

test('un jour dans une URL ne devient pas une heure inventée', () => {
  assert.equal(parisienUrlDate('https://www.leparisien.fr/test-27-09-2026-ABC.php'),null);
});
test('la datePublished de l’article conserve heure et fuseau', () => {
  assert.equal(parisienPageDate('<script type="application/ld+json">{"@type":"NewsArticle","datePublished":"2026-09-27T10:10:37+02:00","dateModified":"2026-09-27T11:00:00+02:00"}</script>').toISOString(),'2026-09-27T08:10:37.000Z');
  assert.equal(parisienPageDate('<script type="application/ld+json">{"@type":"NewsArticle","dateModified":"2026-09-27T11:00:00+02:00"}</script>'),null);
  assert.equal(parisienPageDate('<meta property="article:published_time" content="2026-09-27">'),null);
});
test('les pages indisponibles, les domaines étrangers et dates contradictoires sont rejetés', async () => {
  let calls=0;
  const blocked=async()=>{calls++;return new Response('blocked',{status:403});};
  assert.equal(await resolveParisienDate('https://example.org/x',blocked),null);
  assert.equal(calls,0);
  assert.equal(await resolveParisienDate('https://www.leparisien.fr/x',blocked),null);
  assert.equal(calls,1);
  assert.equal(parisienPageDate('<script type="application/ld+json">{"@type":"NewsArticle","datePublished":"2026-09-27T10:00:00Z"}</script><meta property="article:published_time" content="2026-09-27T11:00:00Z">'),null);
});
