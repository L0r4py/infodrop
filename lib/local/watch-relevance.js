import territory from '../../public/config/pyrenees-watch-territory.json' with { type: 'json' };
import { normalizeText } from './territory.js';

// Ce filtre est opt-in : les rubriques locales existantes ne passent jamais ici.
const normalize = value => normalizeText(String(value || '').replace(/<[^>]+>/g, ' '))
  .replace(/[-']/g, ' ').replace(/\s+/g, ' ').trim();
const communes = new Map(territory.groups.flatMap(group => (
  Object.entries(group.communes).map(([code, name]) => [code, {
    zone: group.zone, locality: name, normalized: normalize(name),
  }])
)));
const byName = new Map([...communes.values()].map(place => [place.normalized, place]));
const regions = [
  { pattern: /\b(?:barousse|neste barousse)\b/, zone: 'barousse', locality: 'Barousse' },
  { pattern: /\bcomminges\b/, zone: 'comminges', locality: 'Comminges' },
  { pattern: /\b(?:luchon|luchonnais)\b/, zone: 'luchonnais', locality: 'Luchonnais' },
  { pattern: /\b(?:lannemezan|vallee d aure|vallee du louron|pays des nestes)\b/, zone: 'nestes_lannemezan', locality: 'Nestes / Lannemezan' },
  { pattern: /\b(?:hautes pyrenees|bigorre)\b/, zone: 'hautes_pyrenees', locality: 'Hautes-Pyrénées' },
  { pattern: /\b(?:val d aran|val aran)\b/, zone: 'val_aran', locality: 'Val d’Aran' },
  { pattern: /\b(?:dans les pyrenees|massif (?:des )?pyrenees|pyrenees centrales|pyrenees haut garonnaises)\b|^pyrenees\b/, zone: 'occitanie', locality: 'Pyrénées' },
];
const publicImpact = /\b(?:alerte|vigilance|secheresse|inondations?|canicule|tempete|restrictions?|fermetures?|greve|perturbations?|perturbe\w*|circulation|travaux|bouchons?|accidents?|trains?|ter|sncf|lio|transports?|reseau ferroviaire|sante|soins|hopitaux?|ars|services? publics?|ecoles?|lycees?|aides?|tarifs?|gratuit\w*)\b/;
const wideScope = /\b(?:(?:toute (?:la |l )?|ensemble (?:de la |du |de l )?)(?:region|occitanie|haute garonne|ariege)|(?:occitanie|haute garonne|ariege) (?:entiere|entier)|(?:occitanie|haute garonne|ariege) (?:est |sera )?placee en vigilance (?:orange|rouge)|vigilance (?:orange|rouge)[^.!?]{0,60}(?:occitanie|haute garonne|ariege)|(?:aide|tarif|dispositif|reseau|transport)s? (?:regional|departemental)\w*|reseau lio|(?:trains?|ter|sncf)[^.!?]{0,80}en occitanie)\b/;
const watchArea = /\b(?:toulouse|haute garonne|hautes pyrenees|ariege|occitanie)\b/;

function fields(item) {
  const categories = (Array.isArray(item.categories) ? item.categories : [item.categories])
    .map(value => normalize(typeof value === 'object' && value ? value._ || value.name || value.label : value))
    .filter(Boolean);
  // Pas de nom du flux ni de page d'accueil : « Actu Toulouse / Occitanie »
  // dans les métadonnées du média ne prouve pas la pertinence d'un article.
  const text = normalize([item.title, item.contentSnippet || item.summary || item.content]
    .filter(Boolean).join(' ').slice(0, 8_000));
  return { categories, text };
}

export function watchRelevance(item = {}, source = {}) {
  const unchanged = {
    accepted: true, reason: 'local-feed',
    zone: source.default_zone, locality: source.default_locality || null,
  };
  if (source.admission !== 'local-relevance') return unchanged;

  const { categories, text } = fields(item);
  let code;
  try { code = new URL(item.link).pathname.match(/\/[^/]+_(\d{5})\//)?.[1]; } catch { /* URL non territorialisée */ }
  const place = communes.get(code) || categories.map(name => byName.get(name)).find(Boolean);
  if (place) return { accepted: true, reason: 'core-commune', zone: place.zone, locality: place.locality };
  if (code?.startsWith('65')) {
    return { accepted: true, reason: 'core-department', zone: 'hautes_pyrenees', locality: 'Hautes-Pyrénées' };
  }

  // Noms courts/homonymes : uniquement code INSEE ou catégorie RSS exacte.
  const mentioned = [...byName.values()].find(place => (
    place.normalized.length >= 7
    && !['valentine', 'cassagne', 'castillon', 'fronsac', 'montesquieu'].includes(place.normalized)
    && ` ${text} `.includes(` ${place.normalized} `)
  ));
  if (mentioned) return { accepted: true, reason: 'core-mention', zone: mentioned.zone, locality: mentioned.locality };
  const region = regions.find(region => region.pattern.test(text) || categories.some(category => region.pattern.test(category)));
  if (region) return { accepted: true, reason: 'core-area', zone: region.zone, locality: region.locality };

  // Axes desservant directement le territoire ; pas de simple mot « mobilité ».
  if (/\b(?:a\s*64|a\s*645|rn\s*125|n\s*125)\b/.test(text) && publicImpact.test(text)) {
    return { ...unchanged, reason: 'territorial-transport' };
  }
  if (watchArea.test(text) && wideScope.test(text) && publicImpact.test(text)) {
    return { ...unchanged, reason: 'regional-impact' };
  }
  return { ...unchanged, accepted: false, reason: 'outside-local-interest' };
}
