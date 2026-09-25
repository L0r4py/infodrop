import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDedupeKey,
  canonicalizeUrl,
  categorizeArticle,
  classifyTerritory,
  deduplicateArticles,
  isWithinRollingWindow,
} from '../lib/local/territory.js';

test('canonicalizeUrl retire les paramètres de suivi sans détruire les paramètres utiles', () => {
  assert.equal(
    canonicalizeUrl('https://Example.com/info/?utm_source=x&q=barousse&fbclid=abc#titre'),
    'https://example.com/info?q=barousse',
  );
});

test('le cœur du Parc est inclus sur mention territoriale explicite', () => {
  const result = classifyTerritory({ title: 'Réouverture de la route à Bagnères-de-Luchon' });
  assert.equal(result.included, true);
  assert.equal(result.zone, 'core');
  assert.equal(result.locality, 'Luchonnais');
});

test('les pôles fonctionnels sont qualifiés séparément', () => {
  const result = classifyTerritory({ title: 'Fibre Excellence : mobilisation à Saint-Gaudens' });
  assert.equal(result.included, true);
  assert.equal(result.zone, 'functional_ring');
  assert.equal(result.locality, 'Saint-Gaudens');
});

test('le Val d’Aran est conservé comme continuité transfrontalière', () => {
  const result = classifyTerritory({ title: 'Travaux sur la route de Bossòst vers Vielha' });
  assert.equal(result.included, true);
  assert.equal(result.zone, 'cross_border');
});

test('une actualité tarbaise sans effet territorial est exclue', () => {
  const result = classifyTerritory({ title: 'Nouvelle exposition au centre-ville de Tarbes' });
  assert.equal(result.included, false);
});

test('une source strictement locale peut qualifier ses publications sans mot-clé', () => {
  const result = classifyTerritory(
    { title: 'Le prochain conseil communautaire se réunira jeudi' },
    { name: 'Cagire Garonne Salat', default_zone: 'core', default_locality: 'Cagire Garonne Salat', requires_keyword: false },
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
