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

export const DISPLAY_ZONES = [
  {
    id: 'barousse',
    label: 'Barousse',
    color: '#30D158',
    legacyZone: 'core',
    relevance: 'core',
    terms: [
      'barousse', 'neste-barousse', 'neste barousse', 'loures-barousse',
      'loures barousse', 'mauleon-barousse', 'mauleon barousse', 'sarp',
      'sacrecoeur de barousse', 'vallee de la barousse', 'gouffre de saoule',
      'bramevaque', 'sost', 'ferrere', 'ilheu', 'anla', 'crechets', 'troubat',
    ],
  },
  {
    id: 'comminges',
    label: 'Comminges',
    color: '#0A84FF',
    legacyZone: 'core',
    relevance: 'core',
    terms: [
      'comminges', 'saint-gaudens', 'saint gaudens', 'saint-gaudinois',
      'saint gaudinois', 'montrejeau', 'montréjeau', 'saint-bertrand-de-comminges',
      'saint bertrand de comminges', 'aspet', 'aurignac', 'salies-du-salat',
      'salies du salat', 'saint-martory', 'saint martory', 'cagire',
      'garonne salat', 'martres-tolosane', 'martres tolosane', 'mane', 'arbas',
      'sengouagnet', 'barbazan', 'gourdan-polignan', 'gourdan polignan',
      'mazeres-sur-salat', 'mazeres sur salat', 'valentine', 'saint-beat-lez',
      'saint beat lez', 'pyrénées haut-garonnaises', 'pyrenees haut garonnaises',
    ],
  },
  {
    id: 'luchonnais',
    label: 'Luchonnais',
    color: '#BF5AF2',
    legacyZone: 'core',
    relevance: 'core',
    terms: [
      'bagneres-de-luchon', 'bagneres de luchon', 'bagnères-de-luchon',
      'bagnères de luchon', 'luchon', 'superbagneres', 'superbagnères',
      'vallee d\'ueil', 'vallée d\'ueil', 'bourg-d\'ueil', 'port de venasque',
      'hospice de france', 'vallee du lys', 'vallée du lys', 'oô', 'lac d\'oo',
      'moustajon', 'cierp-gaud', 'cierp gaud', 'marignac', 'fos', 'saint-aventin',
    ],
  },
  {
    id: 'nestes_lannemezan',
    label: 'Nestes / Lannemezan',
    color: '#FF9F0A',
    legacyZone: 'functional_ring',
    relevance: 'core',
    terms: [
      'lannemezan', 'plateau de lannemezan', 'la barthe-de-neste',
      'la barthe de neste', 'capvern', 'heches', 'hèches', 'vallee des nestes',
      'vallée des nestes', 'pays des nestes', 'arreu', 'aragnouet', 'saint-lary',
      'saint lary', 'vielle-aure', 'vielle aure', 'aure louron', 'vallée d\'aure',
    ],
  },
  {
    id: 'hautes_pyrenees',
    label: 'Hautes-Pyrénées',
    color: '#FF453A',
    legacyZone: 'functional_ring',
    relevance: 'department',
    terms: [
      'hautes-pyrenees', 'hautes pyrenees', 'hautes-pyrénées', 'hautes pyrénées',
      'departement 65', 'département 65', 'bigorre', 'tarbes', 'lourdes',
      'bagneres-de-bigorre', 'bagneres de bigorre', 'bagnères-de-bigorre',
      'bagnères de bigorre', 'argeles-gazost', 'argelès-gazost', 'cauterets',
      'gavarnie', 'gedre', 'gèdre', 'pic du midi', 'vic-en-bigorre',
      'vic en bigorre', 'bagneres', 'bagnères', 'luz-saint-sauveur',
      'luz saint sauveur', 'louron', 'azun', 'ossun', 'trie-sur-baise',
      'trie-sur-baïse', 'maubourguet', 'pouyastruc', 'pierrefitte-nestalas',
    ],
  },
  {
    id: 'val_aran',
    label: 'Val d’Aran',
    color: '#64D2FF',
    legacyZone: 'cross_border',
    relevance: 'cross_border',
    terms: [
      'val d\'aran', 'val d’aran', 'val aran', 'vielha', 'viella', 'bossost',
      'bossòst', 'naut aran', 'baqueira', 'salardu', 'salardú', 'arties',
      'aranes', 'aranès', 'conselh generau d\'aran', 'conselh generau d’aran',
    ],
  },
];

const IMPACT_TERMS = [
  { term: 'rn 125', displayZone: 'comminges' },
  { term: 'rn125', displayZone: 'comminges' },
  { term: 'a64', displayZone: 'comminges' },
  { term: 'ligne montrejeau-luchon', displayZone: 'luchonnais' },
  { term: 'ligne montréjeau-luchon', displayZone: 'luchonnais' },
  { term: 'garonne amont', displayZone: 'comminges' },
  { term: 'gave de garonne', displayZone: 'comminges' },
  { term: 'ger salat', displayZone: 'comminges' },
  { term: 'col du portillon', displayZone: 'luchonnais' },
  { term: 'tunnel de vielha', displayZone: 'val_aran' },
  { term: 'route des cols', displayZone: 'hautes_pyrenees' },
  { term: 'piemont pyreneen', displayZone: 'hautes_pyrenees' },
  { term: 'piémont pyrénéen', displayZone: 'hautes_pyrenees' },
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

function containsCategoryTerm(haystack, term) {
  const normalizedTerm = normalizeText(term);
  const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pluralSuffix = normalizedTerm.includes(' ') ? '' : '(?:s|x)?';
  return new RegExp(`(?:^|[^a-z0-9])${escaped}${pluralSuffix}(?:$|[^a-z0-9])`, 'i').test(haystack);
}

function zoneById(id) {
  return DISPLAY_ZONES.find((zone) => zone.id === id) || null;
}

function sourcePolicy(source = {}) {
  if (source.territory_policy) return source.territory_policy;
  if (source.requires_keyword === false) return 'trusted_local';
  if (source.scope === 'department' && normalizeText(source.default_locality).includes('hautes pyrenees')) {
    return 'department_65';
  }
  return 'regional_strict';
}

function classificationFromZone(zone, source, reason, matchedTerms = [], relevance = zone.relevance) {
  return {
    included: true,
    zone: zone.legacyZone,
    displayZone: zone.id,
    relevance,
    locality: zone.label,
    matchedTerms,
    reason,
  };
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
  const haystack = normalizeText([
    article.title,
    article.resume,
    article.summary,
    article.url,
    ...(article.tags || []),
  ].filter(Boolean).join(' '));

  const explicitMatches = DISPLAY_ZONES.flatMap((zone) => zone.terms
    .filter((term) => containsTerm(haystack, term))
    .map((term) => ({ zone, term })));
  explicitMatches.sort((a, b) => normalizeText(b.term).length - normalizeText(a.term).length);
  if (explicitMatches.length > 0) {
    const { zone, term } = explicitMatches[0];
    return classificationFromZone(zone, source, 'explicit-territory-match', [term]);
  }

  const impactMatch = IMPACT_TERMS.find(({ term }) => containsTerm(haystack, term));
  if (impactMatch) {
    const zone = zoneById(impactMatch.displayZone);
    const policy = sourcePolicy(source);
    const relevance = ['regional_strict', 'specialized_strict', 'pyrenees_strict'].includes(policy)
      ? 'regional_relevant'
      : zone.relevance;
    return classificationFromZone(zone, source, 'territorial-impact-match', [impactMatch.term], relevance);
  }

  const policy = sourcePolicy(source);
  const defaultDisplayZone = source.default_display_zone || source.defaultDisplayZone;
  if (policy === 'department_65') {
    const zone = zoneById(defaultDisplayZone) || zoneById('hautes_pyrenees');
    return {
      ...classificationFromZone(zone, source, 'department-65-source-scope'),
      relevance: 'department',
      locality: source.default_locality || zone.label,
    };
  }

  if (policy === 'trusted_local') {
    const zone = zoneById(defaultDisplayZone);
    if (zone) {
      return {
        ...classificationFromZone(zone, source, 'trusted-local-source-scope'),
        locality: source.default_locality || zone.label,
      };
    }
  }

  return {
    included: false,
    zone: null,
    displayZone: null,
    relevance: null,
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

function normalizedTitle(value = '') {
  return normalizeText(value)
    .replace(/\b(en direct|direct|video|photos?|podcast)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function articleDate(article = {}) {
  return new Date(article.heure || article.published_at || 0).getTime();
}

function articlePriority(article = {}) {
  return Number(article.dedupe_priority || article.__dedupe_priority || 0);
}

function articleDomain(article = {}) {
  try {
    return new URL(article.canonical_url || article.url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function titleSimilarity(left = '', right = '') {
  const leftTokens = new Set(normalizedTitle(left).split(' ').filter((token) => token.length > 2));
  const rightTokens = new Set(normalizedTitle(right).split(' ').filter((token) => token.length > 2));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return intersection / Math.max(leftTokens.size, rightTokens.size);
}

function preferredArticle(left, right) {
  const priorityDifference = articlePriority(left) - articlePriority(right);
  if (priorityDifference !== 0) return priorityDifference > 0 ? left : right;
  return articleDate(left) >= articleDate(right) ? left : right;
}

function nearDuplicate(left, right) {
  const domain = articleDomain(left);
  if (!domain || domain !== articleDomain(right)) return false;
  const timeDifference = Math.abs(articleDate(left) - articleDate(right));
  if (!Number.isFinite(timeDifference) || timeDifference > 48 * 60 * 60 * 1000) return false;
  return titleSimilarity(left.title || left.resume, right.title || right.resume) >= 0.82;
}

export function buildDedupeKey(article = {}) {
  const canonicalUrl = canonicalizeUrl(article.canonical_url || article.url || '');
  if (canonicalUrl) return `url:${canonicalUrl}`;
  return `title:${normalizedTitle(article.title || article.resume || article.summary || '')}`;
}

export function deduplicateArticlesWithMetrics(articles = []) {
  const kept = [];
  const duplicatesBySource = {};

  const markDuplicate = (article) => {
    const sourceSlug = article.source_slug || article.__source_slug || 'unknown';
    duplicatesBySource[sourceSlug] = (duplicatesBySource[sourceSlug] || 0) + 1;
  };

  for (const article of articles) {
    const key = buildDedupeKey(article);
    if (!key || key === 'title:') continue;
    const duplicateIndex = kept.findIndex((candidate) => (
      buildDedupeKey(candidate) === key || nearDuplicate(candidate, article)
    ));
    if (duplicateIndex === -1) {
      kept.push(article);
      continue;
    }

    const existing = kept[duplicateIndex];
    const preferred = preferredArticle(existing, article);
    if (preferred === existing) {
      markDuplicate(article);
    } else {
      markDuplicate(existing);
      kept[duplicateIndex] = article;
    }
  }

  kept.sort((a, b) => articleDate(b) - articleDate(a));
  return { articles: kept, duplicatesBySource };
}

export function deduplicateArticles(articles = []) {
  return deduplicateArticlesWithMetrics(articles).articles;
}

export function presentZone(displayZone) {
  return zoneById(displayZone)?.label || 'Territoire';
}

export function zoneColor(displayZone) {
  return zoneById(displayZone)?.color || '#8E8E93';
}

export const territoryGroups = DISPLAY_ZONES;
