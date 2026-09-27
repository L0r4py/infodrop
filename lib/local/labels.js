// Libellés d’affichage uniquement : aucune décision de collecte.
const SHORT_SOURCE_NAMES = {
  'La Nouvelle République des Pyrénées': 'NRP',
  'France 3 Hautes-Pyrénées': 'France 3 65',
  'La Semaine des Pyrénées': 'Semaine Pyr.',
  'Petite République': 'Petite Rép.',
  'Le Petit Journal - Hautes-Pyrénées': 'Petit Journal 65',
  'Conselh Generau d’Aran': 'Conselh Aran',
  'Centre Hospitalier Comminges Pyrénées': 'CH Comminges',
  'Radio Présence - Comminges': 'Radio Présence',
  'Radio Présence - Infos locales': 'Radio Présence',
};
const SHORT_ZONE_NAMES = {
  'Haute-Garonne sud': 'HG sud',
  'Hautes-Pyrénées': 'HP',
  'Nestes / Lannemezan': 'Nestes',
};
export const shortSourceName = name => SHORT_SOURCE_NAMES[name] || name || 'Source';
export const shortZoneName = name => SHORT_ZONE_NAMES[name] || name;

// Préfixes de format en capitales et suivis d'un séparateur uniquement.
// Ne modifie ni le titre stocké, ni un mot faisant partie de la phrase.
const TITLE_FORMAT_PREFIX = /^(?:(?:(?:EN\s+)?DIRECT|REPLAY)\s+)?(?:VID[ÉE]OS?|PHOTOS?|T[ÉE]MOIGNAGES?|REPORTAGES?|R[ÉE]CIT|ENTRETIEN|INTERVIEW|PORTRAIT|D[ÉE]CRYPTAGE|DIAPORAMA|EN\s+IMAGES|EN\s+DIRECT|DIRECT|REPLAY)\s*[.:：!–—-]+\s*/u;

export function displayArticleTitle(title = '', edition = 'national') {
  if (edition !== 'pyrenees' || typeof title !== 'string') return title;
  let displayed = title.trim();
  while (TITLE_FORMAT_PREFIX.test(displayed)) {
    const next = displayed.replace(TITLE_FORMAT_PREFIX, '').trim();
    if (!next) break;
    displayed = next;
  }
  return displayed;
}
