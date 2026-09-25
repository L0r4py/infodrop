import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const registry = JSON.parse(await readFile(new URL('../public/config/sources-pyrenees.json', import.meta.url), 'utf8'));

test('le registre public ne contient qu’un socle significatif de flux contrôlés', () => {
  assert.ok(registry.sources.length >= 15, `seulement ${registry.sources.length} sources vérifiées`);
  const slugs = registry.sources.map((source) => source.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(registry.sources.every((source) => source.active));
});

test('les URL déclarées sont syntaxiquement valides', () => {
  for (const source of registry.sources) {
    assert.doesNotThrow(() => new URL(source.homepage_url), source.slug);
    if (source.feed_url) assert.doesNotThrow(() => new URL(source.feed_url), `${source.slug} feed`);
  }
});

test('une source active correspond toujours à un flux vérifié', () => {
  for (const source of registry.sources) {
    assert.equal(source.automation, 'rss', source.slug);
    assert.equal(source.verification, 'two-pass-content-verified', source.slug);
    assert.ok(source.feed_url, source.slug);
  }
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
