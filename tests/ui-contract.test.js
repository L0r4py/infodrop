import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/js/app.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/css/style.css', import.meta.url), 'utf8');
const territory = await readFile(new URL('../lib/local/territory.js', import.meta.url), 'utf8');
const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));

test('le flux public ne dépend pas d’une session utilisateur', () => {
  assert.match(index, /x-show="sessionLoaded"/);
  assert.doesNotMatch(index, /x-show="sessionLoaded\s*&&\s*user"/);
  assert.match(app, /await this\.loadNews\(this\.activeFilter, true\)/);
});

test('National et Pyrénées utilisent la même interface et la palette historique', () => {
  assert.match(index, />National<\/a>/);
  assert.match(index, />Pyrénées<\/a>/);
  assert.match(css, /body[\s\S]*font-family:\s*'Inter'/);
  assert.match(css, /\.edition-switch-link\.active[\s\S]*background:\s*#FF2D55/);
  assert.match(index, /bg-\[#0a0a0a\]/);
  assert.deepEqual(vercel.rewrites, [
    { source: '/pyrenees', destination: '/index.html' },
    { source: '/pyrenees/', destination: '/index.html' },
    { source: '/pyrenees/:path*', destination: '/index.html' },
    { source: '/pyrénées', destination: '/index.html' },
    { source: '/pyrénées/', destination: '/index.html' },
    { source: '/pyrénées/:path*', destination: '/index.html' },
  ]);
});

test('les filtres propres à Pyrénées ne polluent pas le flux national', () => {
  assert.match(app, /LOCAL_ONLY_TAGS/);
  assert.match(app, /!LOCAL_ONLY_TAGS\.has\(tag\)/);
});

test('les zones locales ont des filtres et badges sémantiques sans recolorer la marque', () => {
  assert.match(index, /toggleZoneFilter\('all'\)/);
  assert.match(index, /getZoneBadgeStyle\(getArticleDisplayZone\(news\)\)/);
  assert.match(app, /query\.eq\('display_zone', this\.activeZone\)/);
  for (const color of ['#30D158', '#0A84FF', '#BF5AF2', '#FF9F0A', '#FF453A', '#64D2FF']) {
    assert.match(territory, new RegExp(color));
  }
  assert.match(css, /\.edition-switch-link\.active[\s\S]*background:\s*#FF2D55/);
});

test('la version publique vient du package et les métadonnées décrivent les deux éditions', () => {
  assert.match(app, /packageMetadata\.version/);
  assert.match(index, /x-text="'v' \+ productVersion"/);
  assert.doesNotMatch(index, />v5\.0</);
  assert.match(index, /National & Pyrénées H24/);
  assert.match(index, /name="description"/);
});

test('les données personnelles anonymes restent séparées par édition sur l’appareil', () => {
  assert.match(app, /infodrop_\$\{kind\}_\$\{this\.edition\}_v1/);
  assert.match(app, /if \(this\.user\) await this\.saveReadArticleToDB/);
  assert.match(app, /if \(this\.user\) try \{\s*await this\.saveBookmarkToDB/);
});

test('aucun commentaire de conception interdit n’est exposé dans la page publique', () => {
  for (const phrase of [
    'Prototype local V1',
    'sans gamification',
    'sources d’origine conservées',
    'choix éditorial',
    'ancrage dans le Parc',
    'données non simulées',
    'prototype prêt',
    'configurez les variables Supabase',
  ]) {
    assert.equal(index.toLowerCase().includes(phrase.toLowerCase()), false, phrase);
  }
});
