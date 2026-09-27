const TRACKING_PARAMS = new Set([
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
  'xtor',
  'at_campaign',
  'at_medium',
  'at_source',
]);

export const ZONE_PRESENTATION = {
  barousse: { label: 'Barousse', color: '#30D158' },
  comminges: { label: 'Comminges', color: '#0A84FF' },
  luchonnais: { label: 'Luchonnais', color: '#BF5AF2' },
  nestes_lannemezan: { label: 'Nestes / Lannemezan', color: '#FF9F0A' },
  hautes_pyrenees: { label: 'Hautes-Pyrénées', color: '#FF453A' },
  haute_garonne_sud: { label: 'Haute-Garonne sud', color: '#FFD60A' },
  val_aran: { label: 'Val d’Aran', color: '#64D2FF' },
  occitanie: { label: 'Occitanie', color: '#5E5CE6' },
  core: { label: 'Cœur local', color: '#30D158' },
  functional_ring: { label: 'Bassin de vie', color: '#FF9F0A' },
  cross_border: { label: 'Val d’Aran', color: '#64D2FF' },
};

const TERRITORY_GROUPS = [
  {
    zone: 'barousse',
    locality: 'Barousse',
    terms: [
      'barousse', 'loures-barousse', 'loures barousse', 'mauleon-barousse',
      'mauleon barousse', 'sarp', 'sacrecoeur de barousse', 'vallee de la barousse',
      'gouffre de saoule', 'bramevaque', 'sost', 'ferrere', 'ilheu', 'anla',
    ],
  },
  {
    zone: 'comminges',
    locality: 'Comminges',
    terms: [
      'comminges', 'saint-bertrand-de-comminges', 'saint bertrand de comminges',
      'saint-gaudens', 'saint gaudens', 'saint-gaudinois', 'saint gaudinois',
      'montrejeau', 'montréjeau', 'aspet', 'aurignac', 'salies-du-salat',
      'salies du salat', 'saint-martory', 'saint martory', 'cagire',
      'garonne salat', 'martres-tolosane', 'martres tolosane', 'mane', 'arbas',
      'sengouagnet', 'barbazan', 'gourdan-polignan', 'gourdan polignan',
      'mazeres-sur-salat', 'mazeres sur salat', 'valentine',
    ],
  },
  {
    zone: 'luchonnais',
    locality: 'Luchonnais',
    terms: [
      'bagneres-de-luchon', 'bagneres de luchon', 'luchon', 'superbagneres',
      'vallee d\'ueil', 'bourg-d\'ueil', 'port de venasque', 'hospice de france',
      'vallee du lys', 'oô', 'lac d\'oo', 'moustajon', 'cierp-gaud', 'cierp gaud',
      'marignac', 'fos', 'saint-aventin',
    ],
  },
  {
    zone: 'nestes_lannemezan',
    locality: 'Nestes / Lannemezan',
    terms: [
      'lannemezan', 'plateau de lannemezan', 'la barthe-de-neste',
      'la barthe de neste', 'capvern', 'heches', 'hèches', 'nestes', 'neste',
      'saint-laurent-de-neste', 'saint laurent de neste', 'arrea', 'arréau',
      'vallee d\'aure', 'vallée d\'aure', 'louron', 'sarrancolin',
    ],
  },
  {
    zone: 'hautes_pyrenees',
    locality: 'Hautes-Pyrénées',
    terms: [
      'hautes-pyrenees', 'hautes pyrenees', 'haut pyreneen', 'departement 65',
      'département 65', 'tarbes',
      'lourdes', 'bagneres-de-bigorre', 'bagneres de bigorre', 'argeles-gazost',
      'argeles gazost', 'vic-en-bigorre', 'vic en bigorre', 'cauterets',
      'gavarnie', 'gedre', 'gèdre', 'pierrefitte-nestalas', 'pierrefitte nestalas',
      'luz-saint-sauveur', 'luz saint sauveur', 'saint-lary-soulan',
      'saint lary soulan', 'pic du midi', 'bigorre',
    ],
  },
  {
    zone: 'haute_garonne_sud',
    locality: 'Haute-Garonne sud',
    terms: [
      'haute-garonne sud', 'haute garonne sud', 'sud haute-garonne',
      'sud haute garonne', 'pyrenees haut garonnaises', 'pyrénées haut-garonnaises',
      'saint-beat-lez', 'saint beat lez', 'canton de bagneres-de-luchon',
      'canton de bagnères-de-luchon', '31 sud', 'sud 31',
    ],
  },
  {
    zone: 'val_aran',
    locality: 'Val d’Aran',
    terms: [
      'val d\'aran', 'val d’aran', 'val aran', 'vielha', 'viella', 'bossost',
      'bossòst', 'naut aran', 'baqueira', 'salardu', 'salardú',
      'arties', 'aranes', 'aranès', 'conselh generau d\'aran',
    ],
  },
];

const IMPACT_TERMS = [
  'rn 125', 'rn125', 'a64', 'ligne montrejeau-luchon', 'ligne montréjeau-luchon',
  'garonne amont', 'gave de garonne', 'col du portillon', 'tunnel de vielha',
  'route des cols', 'piemont pyreneen', 'piémont pyrénéen', 'massif des pyrenees',
  'massif des pyrénées', 'chaine des pyrenees', 'chaîne des pyrénées',
];

const CATEGORY_RULES = [
  ['Mobilité', ['route', 'circulation', 'travaux', 'train', 'sncf', 'ter ', 'lio', 'navette', 'col ', 'tunnel', 'a64', 'rn125', 'mobilite', 'mobilité']],
  ['Environnement', ['eau', 'secheresse', 'sécheresse', 'foret', 'forêt', 'biodiversite', 'biodiversité', 'ours', 'pollution', 'dechet', 'déchet', 'riviere', 'rivière']],
  ['Montagne', ['montagne', 'neige', 'avalanche', 'ski', 'refuge', 'randonnee', 'randonnée', 'secours', 'estive', 'transhumance', 'col ']],
  ['Santé', ['sante', 'santé', 'hopital', 'hôpital', 'medecin', 'médecin', 'pharmacie', 'ars ', 'soins']],
  ['Services publics', ['mairie', 'prefecture', 'préfecture', 'conseil municipal', 'communaute de communes', 'communauté de communes', 'ecole', 'école', 'decheterie', 'déchèterie']],
  ['Économie', ['emploi', 'entreprise', 'commerce', 'agriculture', 'elevage', 'élevage', 'industrie', 'fibre excellence', 'marche', 'marché', 'tourisme']],
  ['Culture', ['festival', 'concert', 'exposition', 'patrimoine', 'cinema', 'cinéma', 'theatre', 'théâtre', 'musee', 'musée', 'fete', 'fête']],
  ['Sport', ['rugby', 'cyclisme', 'course', 'trail', 'sport', 'football', 'vtt']],
];

export function normalizeText(value = '') {
  const primitive = typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : value && typeof value === 'object'
      ? String(value._ || value.name || value.label || '')
      : '';
  return primitive
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/[^a-zA-Z0-9'\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function containsTerm(haystack, term) {
  const normalizedTerm = normalizeText(term);
  const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(haystack);
}

function containsCategoryTerm(haystack, term) {
  const normalizedTerm = normalizeText(term);
  const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pluralSuffix = normalizedTerm.includes(' ') ? '' : '(?:s|x)?';
  return new RegExp(`(?:^|[^a-z0-9])${escaped}${pluralSuffix}(?:$|[^a-z0-9])`, 'i').test(haystack);
}

export function canonicalizeUrl(value = '') {
  try {
    const url = new URL(value);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_') || TRACKING_PARAMS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
    return url.toString();
  } catch {
    return String(value).trim();
  }
}

export function categorizeArticle(article = {}) {
  const haystack = normalizeText([
    article.title,
    article.resume,
    article.summary,
    ...(article.tags || []),
  ].filter(Boolean).join(' '));

  for (const [category, terms] of CATEGORY_RULES) {
    if (terms.some((term) => containsCategoryTerm(haystack, term))) return category;
  }
  return 'Vie locale';
}

export function classifyTerritory(article = {}, source = {}) {
  const normalizedTags = (Array.isArray(article.tags) ? article.tags : [article.tags])
    .map((tag) => normalizeText(tag))
    .filter(Boolean);
  const haystack = normalizeText([
    article.title,
    article.resume,
    article.summary,
    article.source,
    article.url,
    ...normalizedTags,
  ].filter(Boolean).join(' '));

  const explicitMatches = TERRITORY_GROUPS.flatMap((group) => group.terms
    .filter((term) => containsTerm(haystack, term))
    .map((term) => ({ group, term })));
  explicitMatches.sort((a, b) => normalizeText(b.term).length - normalizeText(a.term).length);
  if (explicitMatches.length > 0) {
    const { group, term } = explicitMatches[0];
    return {
      included: true,
      zone: group.zone,
      locality: group.locality,
      matchedTerms: [term],
      reason: 'explicit-territory-match',
    };
  }

  const impactTerm = IMPACT_TERMS.find((term) => containsTerm(haystack, term));
  if (impactTerm) {
    return {
      included: true,
      zone: source.scope === 'regional_strict' ? 'occitanie' : (source.default_zone || 'occitanie'),
      locality: source.default_locality || 'Pyrénées centrales',
      matchedTerms: [impactTerm],
      reason: 'territorial-impact-match',
    };
  }

  const trustedScope = ['hyperlocal', 'department_65', 'cross_border'].includes(source.scope);
  if ((trustedScope || source.requires_keyword === false) && source.default_zone) {
    return {
      included: true,
      zone: source.default_zone,
      locality: source.default_locality || source.name || 'Territoire',
      matchedTerms: [],
      reason: 'trusted-local-source-scope',
    };
  }

  return {
    included: false,
    zone: null,
    locality: null,
    matchedTerms: [],
    reason: 'outside-territory',
  };
}

export function isWithinRollingWindow(dateValue, hours = 24, now = new Date()) {
  const timestamp = new Date(dateValue).getTime();
  if (!Number.isFinite(timestamp)) return false;
  const age = now.getTime() - timestamp;
  return age >= -5 * 60 * 1000 && age <= hours * 60 * 60 * 1000;
}

export function buildDedupeKey(article = {}) {
  const canonicalUrl = canonicalizeUrl(article.canonical_url || article.url || '');
  if (canonicalUrl) return `url:${canonicalUrl}`;
  const title = normalizeText(article.title || article.resume || article.summary || '')
    .replace(/\b(en direct|direct|video|vidéo|photos?)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `title:${title}`;
}

function normalizedTitle(article = {}) {
  return normalizeText(article.title || article.resume || article.summary || '')
    .replace(/\b(en direct|direct|video|photos?|podcast)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function articleDomain(article = {}) {
  try {
    return new URL(article.canonical_url || article.url || '').hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function titleSimilarity(left = '', right = '') {
  const leftTokens = new Set(normalizeText(left).split(' ').filter((token) => token.length > 2));
  const rightTokens = new Set(normalizeText(right).split(' ').filter((token) => token.length > 2));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return (2 * intersection) / (leftTokens.size + rightTokens.size);
}

function shouldReplace(existing, candidate) {
  const existingPriority = Number(existing.source_priority || 0);
  const candidatePriority = Number(candidate.source_priority || 0);
  if (candidatePriority !== existingPriority) return candidatePriority > existingPriority;
  return new Date(candidate.heure || candidate.published_at || 0) > new Date(existing.heure || existing.published_at || 0);
}

export function deduplicateArticles(articles = []) {
  const kept = [];
  const urlIndexes = new Map();
  const domainIndexes = new Map();
  for (const article of articles) {
    const key = buildDedupeKey(article);
    if (!key || key === 'title:') continue;
    const domain = articleDomain(article);
    const title = normalizedTitle(article);
    let duplicateIndex = urlIndexes.get(key);

    if (duplicateIndex === undefined && domain && title) {
      duplicateIndex = (domainIndexes.get(domain) || []).find((index) => (
        titleSimilarity(title, normalizedTitle(kept[index])) >= 0.9
      ));
    }

    if (duplicateIndex !== undefined) {
      if (shouldReplace(kept[duplicateIndex], article)) {
        kept[duplicateIndex] = article;
        urlIndexes.set(key, duplicateIndex);
      }
      continue;
    }

    const index = kept.length;
    kept.push(article);
    urlIndexes.set(key, index);
    if (domain) domainIndexes.set(domain, [...(domainIndexes.get(domain) || []), index]);
  }
  return kept.sort((a, b) => new Date(b.heure || b.published_at || 0) - new Date(a.heure || a.published_at || 0));
}

export function presentZone(zone) {
  return ZONE_PRESENTATION[zone]?.label || 'Territoire';
}

export const territoryGroups = TERRITORY_GROUPS;
