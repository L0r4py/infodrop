import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DISPLAY_ZONES,
  buildDedupeKey,
  canonicalizeUrl,
  categorizeArticle,
  classifyTerritory,
  deduplicateArticles,
  deduplicateArticlesWithMetrics,
  isWithinRollingWindow,
} from '../lib/local/territory.js';

test('canonicalizeUrl retire les paramètres de suivi sans détruire les paramètres utiles', () => {
  assert.equal(
    canonicalizeUrl('https://Example.com/info/?utm_source=x&q=barousse&fbclid=abc#titre'),
    'https://example.com/info?q=barousse',
  );
});

test('les six zones publiques gardent les couleurs sémantiques demandées', () => {
  assert.deepEqual(
    Object.fromEntries(DISPLAY_ZONES.map(({ id, color }) => [id, color])),
    {
      barousse: '#30D158',
      comminges: '#0A84FF',
      luchonnais: '#BF5AF2',
      nestes_lannemezan: '#FF9F0A',
      hautes_pyrenees: '#FF453A',
      val_aran: '#64D2FF',
    },
  );
});

test('un lieu précis détermine la zone publique affichée', () => {
  const result = classifyTerritory({ title: 'Réouverture de la route à Bagnères-de-Luchon' });
  assert.equal(result.included, true);
  assert.equal(result.displayZone, 'luchonnais');
  assert.equal(result.locality, 'Luchonnais');
});

test('Saint-Gaudens et le Comminges partagent le badge Comminges', () => {
  const result = classifyTerritory({ title: 'Fibre Excellence : mobilisation à Saint-Gaudens' });
  assert.equal(result.included, true);
  assert.equal(result.displayZone, 'comminges');
});

test('le Val d’Aran reste une continuité transfrontalière distincte', () => {
  const result = classifyTerritory({ title: 'Travaux sur la route de Bossòst vers Vielha' });
  assert.equal(result.included, true);
  assert.equal(result.displayZone, 'val_aran');
  assert.equal(result.relevance, 'cross_border');
});

test('une source départementale 65 accepte un sujet sans commune précise', () => {
  const result = classifyTerritory(
    { title: 'Le budget départemental adopté pour la rentrée' },
    {
      territory_policy: 'department_65',
      default_display_zone: 'hautes_pyrenees',
      default_locality: 'Hautes-Pyrénées',
    },
  );
  assert.equal(result.included, true);
  assert.equal(result.displayZone, 'hautes_pyrenees');
  assert.equal(result.relevance, 'department');
  assert.equal(result.reason, 'department-65-source-scope');
});

test('une source Haute-Garonne reste stricte hors sud 31', () => {
  const result = classifyTerritory(
    { title: 'Nouveau chantier dans le centre de Toulouse' },
    { territory_policy: 'south_31', default_display_zone: 'comminges' },
  );
  assert.equal(result.included, false);
});

test('une source strictement locale peut qualifier ses publications sans mot-clé', () => {
  const result = classifyTerritory(
    { title: 'Le prochain conseil communautaire se réunira jeudi' },
    {
      name: 'Cagire Garonne Salat',
      territory_policy: 'trusted_local',
      default_display_zone: 'comminges',
      default_locality: 'Cagire Garonne Salat',
    },
  );
  assert.equal(result.included, true);
  assert.equal(result.reason, 'trusted-local-source-scope');
});

test('la fenêtre de 24 heures refuse les contenus trop anciens', () => {
  const now = new Date('2026-09-25T12:00:00Z');
  assert.equal(isWithinRollingWindow('2026-09-24T12:01:00Z', 24, now), true);
  assert.equal(isWithinRollingWindow('2026-09-24T11:59:00Z', 24, now), false);
});

test('la catégorisation reconnaît la mobilité et garde un repli neutre', () => {
  assert.equal(categorizeArticle({ title: 'Travaux et circulation sur la RN125' }), 'Mobilité');
  assert.equal(categorizeArticle({ title: 'Réunion des habitants jeudi soir' }), 'Vie locale');
});

test('la catégorisation ne confond pas les fragments de mots', () => {
  assert.equal(categorizeArticle({ title: 'Les nageurs reprennent les entraînements' }), 'Vie locale');
  assert.equal(categorizeArticle({ title: 'Un dimanche solidaire pour Septembre Turquoise' }), 'Vie locale');
  assert.equal(categorizeArticle({ title: 'Randonnées à Blajan' }), 'Montagne');
  assert.equal(categorizeArticle({ title: 'Les nageurs reprennent', tags: ['Sports'] }), 'Sport');
});

test('la déduplication neutralise les paramètres de campagne', () => {
  const articles = [
    { title: 'A', url: 'https://exemple.fr/a?utm_source=x', heure: '2026-09-25T09:00:00Z' },
    { title: 'A', url: 'https://exemple.fr/a', heure: '2026-09-25T10:00:00Z' },
  ];
  const result = deduplicateArticles(articles);
  assert.equal(result.length, 1);
  assert.equal(result[0].heure, '2026-09-25T10:00:00Z');
  assert.equal(buildDedupeKey(result[0]), 'url:https://exemple.fr/a');
});

test('un titre quasi identique du même domaine préfère le flux le plus ciblé', () => {
  const result = deduplicateArticlesWithMetrics([
    {
      title: 'RN125 fermée après un éboulement à Saint-Gaudens',
      url: 'https://media.fr/general/rn125-fermee',
      heure: '2026-09-25T10:00:00Z',
      source_slug: 'general',
      dedupe_priority: 10,
    },
    {
      title: 'RN125 fermée après un éboulement à Saint-Gaudens',
      url: 'https://media.fr/comminges/rn125-fermee',
      heure: '2026-09-25T09:55:00Z',
      source_slug: 'cible',
      dedupe_priority: 100,
    },
  ]);
  assert.equal(result.articles.length, 1);
  assert.equal(result.articles[0].source_slug, 'cible');
  assert.equal(result.duplicatesBySource.general, 1);
});

test('deux médias différents traitant le même fait restent deux articles', () => {
  const result = deduplicateArticles([
    { title: 'RN125 fermée à Saint-Gaudens', url: 'https://media-a.fr/article', heure: '2026-09-25T10:00:00Z' },
    { title: 'RN125 fermée à Saint-Gaudens', url: 'https://media-b.fr/article', heure: '2026-09-25T10:01:00Z' },
  ]);
  assert.equal(result.length, 2);
});
