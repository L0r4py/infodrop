import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const registry = JSON.parse(await readFile(new URL('../public/config/sources-pyrenees.json', import.meta.url), 'utf8'));
const candidates = JSON.parse(await readFile(new URL('../config/source-candidates-pyrenees.json', import.meta.url), 'utf8'));

test('le registre public ne contient qu’un socle significatif de flux contrôlés', () => {
  assert.ok(registry.sources.length >= 15, `seulement ${registry.sources.length} sources vérifiées`);
  const slugs = registry.sources.map((source) => source.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(registry.sources.filter((source) => source.active).length, 19);
});

test('les URL déclarées sont syntaxiquement valides', () => {
  for (const source of registry.sources) {
    assert.doesNotThrow(() => new URL(source.homepage_url), source.slug);
    if (source.feed_url) assert.doesNotThrow(() => new URL(source.feed_url), `${source.slug} feed`);
  }
});

test('une source active correspond toujours à un flux vérifié', () => {
  for (const source of registry.sources.filter((candidate) => candidate.active)) {
    assert.equal(source.automation, 'rss', source.slug);
    assert.match(source.verification, /^(two|three)-pass-content-verified$/, source.slug);
    assert.ok(source.feed_url, source.slug);
    assert.ok(source.territory_policy, `${source.slug} sans politique territoriale`);
    assert.ok(source.default_display_zone, `${source.slug} sans zone publique`);
  }
});

test('une source écartée reste archivée sans être présentée comme active', () => {
  const atmo = registry.sources.find((source) => source.slug === 'atmo-occitanie');
  assert.equal(atmo?.active, false);
  assert.equal(atmo?.automation, 'manual-review');
  assert.match(atmo?.verification || '', /investigate/);
});

test('le registre n’introduit aucun classement politique', () => {
  for (const source of registry.sources) {
    assert.equal('orientation' in source, false, source.slug);
    assert.equal('political_label' in source, false, source.slug);
  }
});

test('les trois zones éditoriales sont couvertes', () => {
  const zones = new Set(registry.sources.map((source) => source.default_zone));
  assert.ok(zones.has('core'));
  assert.ok(zones.has('functional_ring'));
  assert.ok(zones.has('cross_border'));
});

test('les six zones publiques sémantiques sont couvertes', () => {
  const zones = new Set(registry.sources.filter((source) => source.active).map((source) => source.default_display_zone));
  for (const zone of [
    'barousse',
    'comminges',
    'luchonnais',
    'nestes_lannemezan',
    'hautes_pyrenees',
    'val_aran',
  ]) {
    assert.ok(zones.has(zone), zone);
  }
});

test('les sources départementales 65 ne dépendent plus d’un mot-clé de commune', () => {
  for (const slug of [
    'departement-hautes-pyrenees',
    'semaine-des-pyrenees',
    'nouvelle-republique-pyrenees',
  ]) {
    const source = registry.sources.find((candidate) => candidate.slug === slug);
    assert.equal(source?.territory_policy, 'department_65', slug);
    assert.equal(source?.requires_keyword, false, slug);
  }
});

test('les compléments de l’audit restent inactifs avant le contrôle Vercel', () => {
  assert.ok(candidates.sources.length >= 20);
  assert.equal(candidates.sources.every((source) => source.active === false), true);
  assert.equal(new Set(candidates.sources.map((source) => source.slug)).size, candidates.sources.length);
  for (const source of candidates.sources) {
    assert.match(source.verification, /pending-two-pass-local-and-vercel/);
    assert.doesNotThrow(() => new URL(source.feed_url), source.slug);
  }
  assert.equal(candidates.local_verification.passed.length, 18);
  assert.equal(Object.keys(candidates.local_verification.failed).length, 4);
});

test('les sources structurantes demandées sont présentes', () => {
  const slugs = new Set(registry.sources.map((source) => source.slug));
  for (const required of [
    'cc-cagire-garonne-salat',
    'cc-neste-barousse',
    'cc-pyrenees-haut-garonnaises',
    'conselh-generau-aran',
    'ville-luchon',
    'ville-saint-gaudens',
  ]) {
    assert.ok(slugs.has(required), required);
  }
});
