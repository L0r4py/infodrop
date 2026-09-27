import test from 'node:test';
import assert from 'node:assert/strict';
import { displayArticleTitle } from '../lib/local/labels.js';

test('retire uniquement les étiquettes initiales des titres Pyrénées', () => {
  for (const prefix of ['VIDEO.', 'VIDÉO.', 'DIRECT VIDÉO :', 'DIRECT VIDEO.', 'TÉMOIGNAGE.', 'TEMOIGNAGE.', 'REPORTAGE.', 'RÉCIT.', 'ENTRETIEN —', 'EN IMAGES.', 'REPLAY VIDÉO.', 'VIDEO. REPORTAGE.']) {
    assert.equal(displayArticleTitle(`${prefix} Visite à Lourdes`, 'pyrenees'), 'Visite à Lourdes', prefix);
  }
});
test('préserve les titres National, le contenu ordinaire et les titres sans reste', () => {
  for (const title of ['VIDEO. Visite à Lourdes', 'DIRECT VIDÉO : Visite']) assert.equal(displayArticleTitle(title, 'national'), title);
  for (const title of ['Un REPORTAGE. À découvrir', 'Témoignage de solidarité', 'VIDEO de la rencontre', 'ALERTE. Vigilance rouge', 'DIRECTEUR : son témoignage', 'VIDÉO.']) {
    assert.equal(displayArticleTitle(title, 'pyrenees'), title);
  }
});
