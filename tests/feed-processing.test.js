import test from 'node:test';
import assert from 'node:assert/strict';
import { processFeedItems } from '../lib/local/feed.js';

const now = new Date('2026-09-26T12:00:00Z');

test('le diagnostic distingue brut, H24, dates invalides, URL et articles qualifiés', () => {
  const source = {
    slug: 'media-65',
    name: 'Média 65',
    source_type: 'media',
    territory_policy: 'department_65',
    default_zone: 'functional_ring',
    default_display_zone: 'hautes_pyrenees',
    default_locality: 'Hautes-Pyrénées',
    dedupe_priority: 80,
  };
  const result = processFeedItems(source, [
    { title: 'Budget départemental', link: 'https://media65.fr/budget', isoDate: '2026-09-26T11:00:00Z' },
    { title: 'Travaux à Lourdes', link: 'https://media65.fr/lourdes', isoDate: '2026-09-26T10:00:00Z' },
    { title: 'Ancien article', link: 'https://media65.fr/ancien', isoDate: '2026-09-24T10:00:00Z' },
    { title: 'Sans date', link: 'https://media65.fr/sans-date' },
    { title: 'Date future', link: 'https://media65.fr/futur', isoDate: '2026-09-26T13:00:00Z' },
    { title: 'Lien manquant', isoDate: '2026-09-26T09:00:00Z' },
  ], { now });

  assert.equal(result.metrics.items_fetched, 6);
  assert.equal(result.metrics.items_in_24h, 3);
  assert.equal(result.metrics.items_rejected_invalid_date, 2);
  assert.equal(result.metrics.items_rejected_invalid_url, 1);
  assert.equal(result.metrics.items_rejected_territory, 0);
  assert.equal(result.articles.length, 2);
  assert.equal(result.articles[0].display_zone, 'hautes_pyrenees');
  assert.equal(result.rejections.length, 4);
});

test('une source régionale conserve le rejet territorial séparé', () => {
  const source = {
    slug: 'media-regional',
    name: 'Média régional',
    source_type: 'media',
    territory_policy: 'regional_strict',
    default_zone: 'core',
    default_display_zone: 'comminges',
  };
  const result = processFeedItems(source, [
    { title: 'Festival à Montpellier', link: 'https://regional.fr/montpellier', isoDate: '2026-09-26T11:00:00Z' },
    { title: 'Travaux à Saint-Gaudens', link: 'https://regional.fr/saint-gaudens', isoDate: '2026-09-26T10:00:00Z' },
  ], { now });

  assert.equal(result.metrics.items_in_24h, 2);
  assert.equal(result.metrics.items_rejected_territory, 1);
  assert.equal(result.articles.length, 1);
  assert.equal(result.articles[0].display_zone, 'comminges');
  assert.equal(result.articles[0].relevance_level, 'core');
});

test('les catégories RSS structurées de France 3 sont normalisées sans erreur', () => {
  const source = {
    slug: 'france3-hautes-pyrenees',
    name: 'France 3 Hautes-Pyrénées',
    source_type: 'media',
    territory_policy: 'department_65',
    default_zone: 'functional_ring',
    default_display_zone: 'hautes_pyrenees',
    default_locality: 'Hautes-Pyrénées',
  };
  const result = processFeedItems(source, [{
    title: 'Une nouvelle mesure départementale',
    link: 'https://france3-regions.franceinfo.fr/occitanie/hautes-pyrenees/article',
    isoDate: '2026-09-26T11:00:00Z',
    categories: [{ _: 'Montagne' }, { $: { term: 'Hautes-Pyrénées' } }],
  }], { now });

  assert.equal(result.articles.length, 1);
  assert.equal(result.metrics.items_rejected_invalid_date, 0);
  assert.equal(result.articles[0].display_zone, 'hautes_pyrenees');
});
