import test from 'node:test';
import assert from 'node:assert/strict';
import { collectSource } from '../api/parse-local-rss.js';
import registry from '../public/config/sources-pyrenees.json' with { type: 'json' };

const tarbes = registry.sources.find(source => source.slug === 'ville-tarbes');
const publication = new Date(Date.now() - 3_600_000).toISOString();
const post = (collection = 'actualite', extra = {}) => ({
  status: 'publish', link: `https://www.tarbes.fr/${collection}/test/`,
  title: { rendered: collection === 'actualite'
    ? 'Réunions : à l&rsquo;écoute des habitants &amp; associations'
    : 'Visite commentée de l’exposition au musée' },
  date_gmt: publication.replace(/\.\d{3}Z$/, ''), ...extra,
});

async function withFetch(mock, run) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push(String(url));
    return mock(String(url), options);
  };
  try { await run(calls); } finally { globalThis.fetch = original; }
}

test('Bigorre conserve sa source et utilise son export RSS PHP fonctionnel', () => {
  const bigorre = registry.sources.find(source => source.slug === 'bigorre-org');
  assert.equal(bigorre.active, true);
  assert.equal(bigorre.feed_url, 'https://www.bigorre.org/rss.php');
});

test('Tarbes conserve le RSS quand il fonctionne, sans appel API supplémentaire', async () => {
  await withFetch(() => new Response(`<rss version="2.0"><channel><title>Tarbes</title><item>
    <title>Conseil municipal</title><link>https://www.tarbes.fr/actualite/test/</link>
    <pubDate>${new Date(publication).toUTCString()}</pubDate></item></channel></rss>`), async calls => {
    const result = await collectSource(tarbes);
    assert.equal(result.status, 'ok');
    assert.equal(result.articles.length, 1);
    assert.deepEqual(calls, [tarbes.feed_url]);
  });
});

test('un 503 Tarbes utilise actualités ET événements avec leur publication UTC et le filtrage existant', async () => {
  await withFetch(url => {
    if (url === tarbes.feed_url) return new Response('Service Unavailable', { status: 503 });
    const collection = new URL(url).pathname.split('/').at(-1);
    return Response.json([
      post(collection),
      post(collection, { link: `https://www.tarbes.fr/${collection}/missing/`, date_gmt: '', date: publication, modified_gmt: publication }),
      post(collection, { status: 'draft' }),
      post(collection, { link: 'https://example.org/injected/' }),
      post(collection, { link: `https://www.tarbes.fr/${collection}/weather/`, title: { rendered: 'La météo à Tarbes : min 12°C, max 24°C' } }),
    ]);
  }, async calls => {
    const result = await collectSource(tarbes);
    assert.equal(result.status, 'ok');
    assert.equal(result.metrics.items_rejected_invalid_date, 2);
    assert.equal(result.articles.length, 2);
    assert.deepEqual(new Set(result.articles.map(article => article.resume)), new Set([
      'Réunions : à l’écoute des habitants & associations', 'Visite commentée de l’exposition au musée',
    ]));
    assert.ok(result.articles.every(article => article.heure === new Date(post().date_gmt + 'Z').toISOString()));
    assert.ok(calls.some(url => url.includes('/wp/v2/actualite?')));
    assert.ok(calls.some(url => url.includes('/wp/v2/evenement?')));
    assert.equal(calls.length, 4);
  });
});

test('aucun repli sur les autres sources, les 403 ou une protection anti-robot Tarbes', async () => {
  for (const [source, status, body] of [
    [{ ...tarbes, slug: 'autre-source' }, 503, 'Service Unavailable'],
    [tarbes, 403, 'Forbidden'],
    [tarbes, 503, 'Just a moment... challenge-platform'],
  ]) {
    await withFetch(() => new Response(body, { status }), async calls => {
      const result = await collectSource(source);
      assert.equal(result.status, 'error');
      assert.equal(result.error_message, `HTTP ${status}`);
      assert.equal(calls.length, 2);
      assert.ok(calls.every(url => !url.includes('/wp-json/')));
    });
  }
});

test('une collection Tarbes inaccessible reste une erreur réelle, sans succès partiel trompeur', async () => {
  await withFetch(url => {
    if (url === tarbes.feed_url) return new Response('', { status: 503 });
    if (url.includes('/evenement?')) return new Response('', { status: 503 });
    return Response.json([post()]);
  }, async () => {
    const result = await collectSource(tarbes);
    assert.equal(result.status, 'error');
    assert.match(result.error_message, /HTTP 503 ; API officielle Tarbes \(evenement\) : HTTP 503/);
    assert.equal(result.articles.length, 0);
  });
});
