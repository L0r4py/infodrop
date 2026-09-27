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

export function isWithinRollingWindow(dateValue, hours = 24, now = new Date()) {
  const timestamp = new Date(dateValue).getTime();
  if (!Number.isFinite(timestamp)) return false;
  const age = now.getTime() - timestamp;
  return age >= -5 * 60 * 1000 && age <= hours * 60 * 60 * 1000;
}

export function buildDedupeKey(article = {}) {
  const syndicatedKey = syndicatedArticleKey(article);
  if (syndicatedKey) return syndicatedKey;
  const canonicalUrl = canonicalizeUrl(article.canonical_url || article.url || '');
  if (canonicalUrl) return `url:${canonicalUrl}`;
  const title = normalizeText(article.title || article.resume || article.summary || '')
    .replace(/\b(en direct|direct|video|vidéo|photos?)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `title:${title}`;
}

// Reprises identifiées entre ces deux sites seulement : jamais un regroupement par sujet.
export function syndicatedArticleKey(article = {}) {
  try {
    const url = new URL(article.canonical_url || article.url || '');
    if (!['ladepeche.fr', 'nrpyrenees.fr'].includes(url.hostname.replace(/^www\./, ''))) return null;
    const id = url.pathname.match(/-(\d+)\.php$/)?.[1];
    return id ? `depeche-syndication:${id}` : null;
  } catch { return null; }
}

// À l'affichage, masque aussi les reprises déjà en base, sans supprimer les lignes.
export function deduplicateSyndicatedArticles(articles = []) {
  const seen = new Set();
  return articles.filter(article => {
    const key = syndicatedArticleKey(article);
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
