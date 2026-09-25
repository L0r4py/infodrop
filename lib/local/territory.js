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

const TERRITORY_GROUPS = [
  {
    zone: 'core',
    locality: 'Comminges',
    terms: [
      'comminges', 'saint-bertrand-de-comminges', 'saint bertrand de comminges',
      'aspet', 'aurignac', 'salies-du-salat', 'salies du salat', 'saint-martory',
      'saint martory', 'cagire', 'garonne salat', 'martres-tolosane',
      'martres tolosane', 'mane', 'arbas', 'sengouagnet', 'barbazan',
      'gourdan-polignan', 'gourdan polignan', 'mazeres-sur-salat',
      'mazeres sur salat', 'valentine', 'saint-beat-lez', 'saint beat lez',
    ],
  },
  {
    zone: 'core',
    locality: 'Luchonnais',
    terms: [
      'bagneres-de-luchon', 'bagneres de luchon', 'luchon', 'superbagneres',
      'superbagneres', 'vallee d\'ueil', 'bourg-d\'ueil', 'port de venasque',
      'hospice de france', 'vallee du lys', 'oô', 'lac d\'oo', 'moustajon',
      'cierp-gaud', 'cierp gaud', 'marignac', 'fos', 'saint-aventin',
    ],
  },
  {
    zone: 'core',
    locality: 'Barousse',
    terms: [
      'barousse', 'loures-barousse', 'loures barousse', 'mauleon-barousse',
      'mauleon barousse', 'sarp', 'sacrecoeur de barousse', 'vallee de la barousse',
      'gouffre de saoule', 'bramevaque', 'sost', 'ferrere', 'ilheu', 'anla',
    ],
  },
  {
    zone: 'functional_ring',
    locality: 'Saint-Gaudens',
    terms: ['saint-gaudens', 'saint gaudens', 'saint-gaudinois', 'saint gaudinois'],
  },
  {
    zone: 'functional_ring',
    locality: 'Montréjeau',
    terms: ['montrejeau', 'montréjeau', 'lac de montrejeau', 'lac de montréjeau'],
  },
  {
    zone: 'functional_ring',
    locality: 'Lannemezan',
    terms: [
      'lannemezan', 'plateau de lannemezan', 'la barthe-de-neste',
      'la barthe de neste', 'capvern', 'heches', 'hèches', 'nestes',
    ],
  },
  {
    zone: 'cross_border',
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
  'route des cols', 'piemont pyreneen', 'piémont pyrénéen',
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
  return String(value)
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
    if (terms.some((term) => haystack.includes(normalizeText(term)))) return category;
  }
  return 'Vie locale';
}

export function classifyTerritory(article = {}, source = {}) {
  const haystack = normalizeText([
    article.title,
    article.resume,
    article.summary,
    article.source,
    article.url,
    ...(article.tags || []),
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
      zone: source.default_zone || 'functional_ring',
      locality: source.default_locality || 'Pyrénées centrales',
      matchedTerms: [impactTerm],
      reason: 'territorial-impact-match',
    };
  }

  if (source.requires_keyword === false && source.default_zone) {
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

export function deduplicateArticles(articles = []) {
  const kept = new Map();
  for (const article of articles) {
    const key = buildDedupeKey(article);
    if (!key || key === 'title:') continue;
    const existing = kept.get(key);
    if (!existing || new Date(article.heure || article.published_at || 0) > new Date(existing.heure || existing.published_at || 0)) {
      kept.set(key, article);
    }
  }
  return [...kept.values()].sort((a, b) => new Date(b.heure || b.published_at || 0) - new Date(a.heure || a.published_at || 0));
}

export function presentZone(zone) {
  return {
    core: 'Cœur du Parc',
    functional_ring: 'Bassin de vie',
    cross_border: 'Val d’Aran',
  }[zone] || 'Territoire';
}

export const territoryGroups = TERRITORY_GROUPS;
