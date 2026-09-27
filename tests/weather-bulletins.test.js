import test from 'node:test';
import assert from 'node:assert/strict';
import { isAutomaticWeatherBulletin } from '../lib/local/weather-bulletins.js';
import { collectSource } from '../api/parse-local-rss.js';

const bulletins = [
  'la météo à Tarbes (fr) : la température ira de 17°C à 27°C lundi 28 septembre 2026',
  'Météo à Lourdes : pluie et vent demain',
  'Prévisions météo à Saint-Gaudens',
  'MÉTÉO À Luchon : 18°C',
  'Bulletin météo local : min 12°C, max 24°C',
  'Météo : Tarbes, pluie 2 mm, vent 15 km/h',
];
const retained = [
  'Maria Marquina, une artiste prête à aller plus loin',
  'La météo à Tarbes : vigilance orange pour les orages',
  'Prévisions météo à Lourdes : alerte rouge',
  'Neige exceptionnelle : les routes sont coupées',
  'Inondations : les commerces rouvrent',
  'Canicule, tempête : les conséquences locales',
  'Météo : pourquoi le climat change dans les Pyrénées',
  'La météo à Tarbes : comment les prévisionnistes travaillent',
  'Météo : des pluies attendues ce week-end',
  'Tarbes : le vent change pour le club local',
];
test('seuls les gabarits automatiques sont exclus ; alertes et journalisme conservés', () => {
  for (const title of bulletins) assert.equal(isAutomaticWeatherBulletin(title), true, title);
  for (const title of retained) assert.equal(isAutomaticWeatherBulletin(title), false, title);
});
test('le collecteur applique la règle à toutes les sources locales sans bloquer leurs articles normaux', async () => {
  const originalFetch = globalThis.fetch;
  const date = new Date(Date.now() - 3600000).toUTCString();
  globalThis.fetch = async () => new Response(`<rss version="2.0"><channel><title>Test</title>${[...bulletins, ...retained].map((title, i) => `<item><title>${title}</title><link>https://example.org/${i}</link><pubDate>${date}</pubDate></item>`).join('')}</channel></rss>`);
  try {
    for (const slug of ['bigorre-org', 'autre-source']) {
      const result = await collectSource({ slug, name: slug, default_zone: 'hautes_pyrenees' });
      assert.equal(result.status, 'ok');
      assert.deepEqual(result.articles.map(a => a.resume), retained);
    }
  } finally { globalThis.fetch = originalFetch; }
});
