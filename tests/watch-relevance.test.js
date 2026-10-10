import test from 'node:test';
import assert from 'node:assert/strict';
import { watchRelevance } from '../lib/local/watch-relevance.js';
import { collectSource } from '../api/parse-local-rss.js';
import registry from '../public/config/sources-pyrenees.json' with { type: 'json' };

const source = registry.sources.find(source => source.slug === 'actu-toulouse');
const item = (title, extra = {}) => ({ title, link: 'https://actu.fr/occitanie/toulouse_31555/article_64900000.html', ...extra });

test('Actu Toulouse est une veille explicite, sans changer les autres sources', () => {
  assert.equal(source.admission, 'local-relevance');
  assert.equal(source.default_zone, 'occitanie');
  assert.deepEqual(registry.sources.filter(source => source.admission).map(source => source.slug), ['actu-toulouse']);
  assert.equal(watchRelevance(item('Un conseil à Montpellier'), { default_zone: 'barousse', default_locality: 'Barousse' }).accepted, true);
});

test('le vrai item RSS de Castelbiague est reconnu par son code, malgré un titre départemental', () => {
  const result = watchRelevance(item('Une maison et une grange touchées par un incendie en Haute-Garonne', {
    link: 'https://actu.fr/occitanie/castelbiague_31114/l-ensemble-etait-totalement-embrase_64907273.html',
    categories: ['Actu Toulouse', 'Occitanie', 'Haute-Garonne', 'Castelbiague'],
  }), source);
  assert.equal(result.accepted, true);
  assert.equal(result.zone, 'comminges');
  assert.equal(result.locality, 'Castelbiague');
});

test('les communes de Barousse et des Hautes-Pyrénées sont admissibles', () => {
  for (const [slug, zone] of [['esbareich_65158', 'barousse'], ['tarbes_65440', 'hautes_pyrenees']]) {
    const result = watchRelevance(item('Une initiative locale', { link: `https://actu.fr/occitanie/${slug}/initiative_64900000.html` }), source);
    assert.equal(result.accepted, true, slug);
    assert.equal(result.zone, zone, slug);
  }
});

test('une catégorie communale exacte ou une mention locale explicite suffit', () => {
  assert.equal(watchRelevance(item('Une initiative locale', { categories: [{ _: 'Castelbiague' }] }), source).zone, 'comminges');
  assert.equal(watchRelevance(item('À Esbareich, un nouveau service ouvre'), source).zone, 'barousse');
  assert.equal(watchRelevance(item('Toulouse : les trains vers Luchon changent d’horaires'), source).zone, 'luchonnais');
  assert.equal(watchRelevance(item('Des chutes de neige exceptionnelles dans les Pyrénées'), source).accepted, true);
  assert.equal(watchRelevance(item('Pyrénées : un refuge rénové'), source).accepted, true);
});

test('la vie toulousaine et les seuls tags Occitanie/Haute-Garonne ne suffisent pas', () => {
  for (const title of [
    'Une rixe éclate entre SDF sur les bords de Garonne à Toulouse',
    'Un nouveau café ouvre à Toulouse',
    'Téléo : nouveaux horaires du téléphérique de Toulouse',
    'Toulouse : ouverture d’un centre de soins dans ce quartier',
    'Toulouse : 23 pompiers mobilisés pour un incendie',
    'Toulouse : rendez-vous au festival de cinéma',
    'Toulouse : une interview de Valentine, créatrice de bijoux',
    'Un dispositif régional récompensé à Bordeaux',
  ]) {
    assert.equal(watchRelevance(item(title, { categories: ['Actu Toulouse', 'Occitanie', 'Haute-Garonne', 'Toulouse'] }), source).accepted, false, title);
  }
});

test('la veille Ariège reste conditionnée à un lien territorial ou un impact collectif', () => {
  assert.equal(watchRelevance(item('Foix : une nouvelle boutique', { categories: ['Ariège', 'Foix'] }), source).accepted, false);
  assert.equal(watchRelevance(item('Ariège placée en vigilance orange pour les orages'), source).accepted, true);
});

test('alertes et impacts régionaux explicites sont conservés, sans ouvrir tout le département', () => {
  for (const title of [
    'Orages : la Haute-Garonne placée en vigilance orange',
    'Les trains perturbés dans toute l’Occitanie pendant la grève',
    'Une nouvelle aide régionale aux lycéens en Occitanie',
    'Restrictions d’eau dans toute la Haute-Garonne',
    'A64 : fermeture entre Toulouse et Saint-Gaudens',
    'A64 : circulation perturbée près de Toulouse',
  ]) assert.equal(watchRelevance(item(title), source).accepted, true, title);
  assert.equal(watchRelevance(item('Restrictions d’eau dans deux communes de Haute-Garonne'), source).accepted, false);
  assert.equal(watchRelevance(item('A61 : fermeture près de Toulouse'), source).accepted, false);
  assert.equal(watchRelevance(item('Deux communes du Gers privées d’eau potable'), source).accepted, false);
});

test('le collecteur ne publie que les items pertinents, avec leur date réelle', async () => {
  const originalFetch = globalThis.fetch;
  const published = new Date(Date.now() - 3600000);
  globalThis.fetch = async () => new Response(`<rss version="2.0"><channel><title>Actu Toulouse</title>
    <item><title>Un incendie en Haute-Garonne</title><link>https://actu.fr/occitanie/castelbiague_31114/incendie_64907273.html</link><pubDate>${published.toUTCString()}</pubDate></item>
    <item><title>Un café ouvre à Toulouse</title><link>https://actu.fr/occitanie/toulouse_31555/cafe_64900001.html</link><pubDate>${published.toUTCString()}</pubDate></item>
    <item><title>La météo à Luchon</title><link>https://actu.fr/occitanie/bagneres-de-luchon_31042/meteo_64900002.html</link><pubDate>${published.toUTCString()}</pubDate></item>
    <item><title>Orages : la Haute-Garonne placée en vigilance orange</title><link>https://actu.fr/meteo/alerte_64900003.html</link><pubDate>${published.toUTCString()}</pubDate></item>
    <item><title>Esbareich : article sans date</title><link>https://actu.fr/occitanie/esbareich_65158/sans-date_64900004.html</link></item>
  </channel></rss>`);
  try {
    const result = await collectSource(source);
    assert.equal(result.status, 'ok');
    assert.equal(result.articles.length, 2);
    assert.equal(result.metrics.items_rejected_territory, 1);
    assert.equal(result.metrics.items_rejected_invalid_date, 1);
    assert.equal(result.articles.find(article => article.locality === 'Castelbiague').territory_zone, 'comminges');
    assert.ok(result.articles.every(article => article.heure === new Date(published.toUTCString()).toISOString()));
    assert.ok(result.articles.every(article => article.edition_slug === 'pyrenees'));
  } finally { globalThis.fetch = originalFetch; }
});
