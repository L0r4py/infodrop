import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { diversifyLocalArticles } from '../lib/local/diversify.js';
import { deduplicateSyndicatedArticles } from '../lib/local/territory.js';
import { isAutomaticWeatherBulletin } from '../lib/local/weather-bulletins.js';

const source = await readFile(new URL('../src/js/app.js', import.meta.url), 'utf8');
function methodBetween(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, start);
  return source.slice(from, to);
}
// Exécuter les méthodes réellement utilisées par Alpine, sans démarrer le navigateur.
const methods = new Function(
  'diversifyLocalArticles', 'deduplicateSyndicatedArticles', 'isAutomaticWeatherBulletin',
  `return ({${methodBetween('distributeArticles(articles) {', 'async loadData(')}
    ${methodBetween('async loadNews(', 'async loadMoreNews(')}});`,
)(diversifyLocalArticles, deduplicateSyndicatedArticles, isAutomaticWeatherBulletin);

const head = { id: 1, resume: 'Saison culturelle', source: 'A', heure: '2026-10-10T10:18:00Z' };
const delayed = { id: 2, resume: 'Incendie à Castelbiague', source: 'B', heure: '2026-10-10T07:09:22Z' };
const loadedOlder = { id: 3, resume: 'Conseil municipal', source: 'C', heure: '2026-10-09T20:00:00Z' };

function fixture(isLocalEdition = true, available = [head, delayed]) {
  const calls = [];
  const state = {
    ...methods, isLocalEdition, newsPageSize: 50, newsOffset: 50, hasMoreNews: true,
    newsList: [head, loadedOlder], latestNewsTimestamp: head.heure,
    updateLocalStats() {},
    async fetchNews(options) {
      calls.push(options);
      const rows = options.newerThan
        ? available.filter(article => new Date(article.heure) > new Date(options.newerThan))
        : available;
      return { data: rows.slice(options.offset, options.offset + options.limit), error: null };
    },
  };
  return { state, calls };
}

test('Pyrénées récupère un article arrivé tard sans changer sa vraie date ni perdre les cartes chargées', async () => {
  const { state, calls } = fixture();
  await state.loadNews('comminges', false);
  assert.equal(calls[0].newerThan, null);
  assert.equal(calls[0].filter, 'comminges');
  assert.equal(calls[0].limit, 50);
  assert.deepEqual(state.newsList.map(article => article.id), [1, 2, 3]);
  assert.equal(state.newsList[1].heure, delayed.heure);
  assert.equal(state.latestNewsTimestamp, head.heure);
  assert.equal(state.newsOffset, 50);
  // Un second rafraîchissement identique ne doit pas multiplier les cartes.
  await state.loadNews('comminges', false);
  assert.deepEqual(state.newsList.map(article => article.id), [1, 2, 3]);
  assert.equal(state.dataError, false);
});

test('Pyrénées accepte aussi un nouvel article à heure identique et remplace la version en mémoire', async () => {
  const updatedHead = { ...head, resume: 'Saison culturelle : titre corrigé' };
  const sameTime = { ...delayed, heure: head.heure };
  const { state } = fixture(true, [updatedHead, sameTime]);
  await state.loadNews('all', false);
  assert.equal(state.newsList.filter(article => article.id === 1).length, 1);
  assert.equal(state.newsList.find(article => article.id === 1).resume, updatedHead.resume);
  assert.ok(state.newsList.some(article => article.id === 2));
});

test('National conserve son rafraîchissement historique par date et le chargement initial reste paginé', async () => {
  const { state, calls } = fixture(false);
  await state.loadNews('all', false);
  assert.equal(calls[0].newerThan, head.heure);
  assert.deepEqual(state.newsList, [head, loadedOlder]);
  await state.loadNews('all', true);
  assert.equal(calls[1].newerThan, null);
  assert.equal(state.newsOffset, 2);
  assert.equal(state.hasMoreNews, false);
  assert.deepEqual(state.newsList, [head, delayed]);
});
