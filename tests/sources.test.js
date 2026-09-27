import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const registry = JSON.parse(await readFile(new URL('../public/config/sources-pyrenees.json', import.meta.url), 'utf8'));

test('le registre public ne contient qu’un socle significatif de flux contrôlés', () => {
  assert.ok(registry.sources.length >= 15, `seulement ${registry.sources.length} sources vérifiées`);
  const slugs = registry.sources.map((source) => source.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(registry.sources.some(source => source.active));
  assert.equal(new Set(registry.sources.filter(source => source.active).map(source => source.feed_url)).size, registry.sources.filter(source => source.active).length);
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
    assert.match(
      source.verification,
      /^(?:(two|three)-pass-content-verified|two-pass-vercel-verified-\d{4}-\d{2}-\d{2})$/,
      source.slug,
    );
    assert.ok(source.feed_url, source.slug);
    assert.ok(source.default_zone, source.slug);
    assert.equal('requires_keyword' in source, false, source.slug);
    assert.ok(!['regional_strict', 'specialized_strict', 'south_31'].includes(source.scope), source.slug);
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

test('les zones éditoriales du périmètre élargi sont couvertes', () => {
  const zones = new Set(registry.sources.map((source) => source.default_zone));
  for (const required of [
    'barousse',
    'comminges',
    'luchonnais',
    'nestes_lannemezan',
    'hautes_pyrenees',
    'haute_garonne_sud',
    'val_aran',
    'occitanie',
  ]) {
    assert.ok(zones.has(required), required);
  }
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
