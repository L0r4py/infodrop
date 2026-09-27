import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDedupeKey,
  canonicalizeUrl,
  categorizeArticle,
  classifyTerritory,
  deduplicateArticles,
  isWithinRollingWindow,
  titleSimilarity,
} from '../lib/local/territory.js';

test('canonicalizeUrl retire les paramètres de suivi sans détruire les paramètres utiles', () => {
  assert.equal(
    canonicalizeUrl('https://Example.com/info/?utm_source=x&q=barousse&fbclid=abc#titre'),
    'https://example.com/info?q=barousse',
  );
});

test('le Luchonnais est inclus sur mention territoriale explicite', () => {
  const result = classifyTerritory({ title: 'Réouverture de la route à Bagnères-de-Luchon' });
  assert.equal(result.included, true);
  assert.equal(result.zone, 'luchonnais');
  assert.equal(result.locality, 'Luchonnais');
});

test('le Comminges est qualifié séparément', () => {
  const result = classifyTerritory({ title: 'Fibre Excellence : mobilisation à Saint-Gaudens' });
  assert.equal(result.included, true);
  assert.equal(result.zone, 'comminges');
  assert.equal(result.locality, 'Comminges');
});

test('le Val d’Aran est conservé comme continuité transfrontalière', () => {
  const result = classifyTerritory({ title: 'Travaux sur la route de Bossòst vers Vielha' });
  assert.equal(result.included, true);
  assert.equal(result.zone, 'val_aran');
});

test('une actualité tarbaise appartient aux Hautes-Pyrénées', () => {
  const result = classifyTerritory({ title: 'Nouvelle exposition au centre-ville de Tarbes' });
  assert.equal(result.included, true);
  assert.equal(result.zone, 'hautes_pyrenees');
});

test('une actualité régionale sans lien avec le périmètre reste exclue', () => {
  const result = classifyTerritory(
    { title: 'Nouvelle exposition au centre-ville de Montpellier' },
    { scope: 'regional_strict', default_zone: 'occitanie', requires_keyword: true },
  );
  assert.equal(result.included, false);
});

test('un identifiant numérique 65 dans une URL ne suffit pas à qualifier un article', () => {
  const result = classifyTerritory(
    { title: 'Nouvelle exposition à Montpellier', url: 'https://example.test/actualites/65-exposition' },
    { scope: 'regional_strict', default_zone: 'occitanie', requires_keyword: true },
  );
  assert.equal(result.included, false);
});

test('une source strictement locale peut qualifier ses publications sans mot-clé', () => {
  const result = classifyTerritory(
    { title: 'Le prochain conseil communautaire se réunira jeudi' },
    { name: 'Cagire Garonne Salat', scope: 'hyperlocal', default_zone: 'comminges', default_locality: 'Cagire Garonne Salat', requires_keyword: false },
  );
  assert.equal(result.included, true);
  assert.equal(result.reason, 'trusted-local-source-scope');
});

test('une source départementale 65 accepte un sujet sans commune explicite', () => {
  const result = classifyTerritory(
    { title: 'Le Département adopte son budget consacré aux collèges' },
    { scope: 'department_65', default_zone: 'hautes_pyrenees', default_locality: 'Hautes-Pyrénées', requires_keyword: false },
  );
  assert.equal(result.included, true);
  assert.equal(result.zone, 'hautes_pyrenees');
});

test('les catégories RSS structurées ne cassent pas la qualification', () => {
  const result = classifyTerritory({
    title: 'Une mesure annoncée pour le territoire',
    tags: [{ _: 'Hautes-Pyrénées', $: { domain: 'https://example.test' } }],
  });
  assert.equal(result.included, true);
  assert.equal(result.zone, 'hautes_pyrenees');
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

test('la déduplication rapproche les titres quasi identiques sur un même domaine seulement', () => {
  const articles = [
    { title: 'Travaux importants sur la RN 125 entre Saint-Gaudens et Luchon', url: 'https://media.fr/a', heure: '2026-09-27T01:00:00Z' },
    { title: 'Travaux sur la RN 125 entre Saint-Gaudens et Luchon', url: 'https://media.fr/b', heure: '2026-09-27T02:00:00Z' },
    { title: 'Travaux sur la RN 125 entre Saint-Gaudens et Luchon', url: 'https://autre.fr/c', heure: '2026-09-27T02:00:00Z' },
  ];
  assert.ok(titleSimilarity(articles[0].title, articles[1].title) >= 0.9);
  assert.equal(deduplicateArticles(articles).length, 2);
});
