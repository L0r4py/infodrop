import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDedupeKey,
  canonicalizeUrl,
  categorizeArticle,
  deduplicateArticles,
  deduplicateSyndicatedArticles,
  isWithinRollingWindow,
  titleSimilarity,
} from '../lib/local/territory.js';

test('les reprises Dépêche/NRP partagent uniquement leur identifiant article', () => {
  const article = (domain, id, title = 'Le pape à Lourdes') => ({
    resume: title, url: `https://${domain}/2026/09/26/article-${id}.php`, heure: '2026-09-27T18:15:54Z',
  });
  const pair = [article('www.ladepeche.fr', 13570596), article('www.nrpyrenees.fr', 13570596, 'Un titre corrigé')];
  assert.equal(deduplicateArticles(pair).length, 1);
  assert.equal(deduplicateSyndicatedArticles(pair).length, 1);
  const distinct = [pair[0], article('www.nrpyrenees.fr', 13570597), article('autre.fr', 13570596)];
  assert.equal(deduplicateArticles(distinct).length, 3);
  assert.equal(deduplicateSyndicatedArticles(distinct).length, 3);
  assert.equal(deduplicateSyndicatedArticles([{url:'invalide'}, {url:'invalide'}]).length, 2);
});

test('canonicalizeUrl retire les paramètres de suivi sans détruire les paramètres utiles', () => {
  assert.equal(
    canonicalizeUrl('https://Example.com/info/?utm_source=x&q=barousse&fbclid=abc#titre'),
    'https://example.com/info?q=barousse',
  );
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
