import Parser from 'rss-parser';
import registry from '../public/config/sources-pyrenees.json' with { type: 'json' };
import { classifyTerritory, isWithinRollingWindow } from '../lib/local/territory.js';

const parser = new Parser();
const TIMEOUT_MS = 12_000;
const SAMPLE_SIZE = 20;
const MAX_FRESHNESS_DAYS = 180;

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validDate(value) {
  return Number.isFinite(new Date(value).getTime());
}

async function inspectOnce(source) {
  const startedAt = Date.now();
  try {
    const response = await fetch(source.feed_url, {
      redirect: 'follow',
      headers: {
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
        'User-Agent': 'infodrop.live source verifier/1.0 (+https://infodrop.live/)',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    const feed = await parser.parseString(xml);
    const items = (feed.items || []).slice(0, SAMPLE_SIZE);
    if (items.length === 0) throw new Error('Flux sans article');

    const titlesValid = items.filter((item) => String(item.title || '').trim().length > 0).length;
    const linksValid = items.filter((item) => validHttpUrl(item.link)).length;
    const datesValid = items.filter((item) => validDate(item.isoDate || item.pubDate)).length;
    const parsedDates = items
      .map((item) => new Date(item.isoDate || item.pubDate))
      .filter((date) => Number.isFinite(date.getTime()))
      .sort((a, b) => b - a);
    const newest = parsedDates[0] || null;
    const freshnessDays = newest ? Math.floor((Date.now() - newest.getTime()) / 86_400_000) : null;
    const futureMinutes = newest ? Math.ceil((newest.getTime() - Date.now()) / 60_000) : null;
    const qualifiedLast24h = items.filter((item) => {
      const publishedAt = item.isoDate || item.pubDate;
      if (!isWithinRollingWindow(publishedAt)) return false;
      return classifyTerritory({
        title: item.title,
        resume: item.contentSnippet,
        url: item.link,
        source: source.name,
        tags: item.categories || [],
      }, source).included;
    }).length;

    const passed = titlesValid === items.length
      && linksValid === items.length
      && datesValid === items.length
      && freshnessDays !== null
      && freshnessDays <= MAX_FRESHNESS_DAYS
      && futureMinutes <= 5;

    return {
      ok: passed,
      http_status: response.status,
      final_url: response.url,
      content_type: response.headers.get('content-type'),
      duration_ms: Date.now() - startedAt,
      items_checked: items.length,
      titles_valid: titlesValid,
      links_valid: linksValid,
      dates_valid: datesValid,
      newest_at: newest?.toISOString() || null,
      freshness_days: freshnessDays,
      future_minutes: futureMinutes,
      qualified_last_24h: qualifiedLast24h,
      sample: items[0] ? {
        title: items[0].title || null,
        link: items[0].link || null,
        date: items[0].isoDate || items[0].pubDate || null,
      } : null,
      error: passed ? null : 'Un ou plusieurs contrôles de contenu ont échoué',
    };
  } catch (error) {
    return {
      ok: false,
      duration_ms: Date.now() - startedAt,
      error: String(error?.message || error),
    };
  }
}

async function verifySource(source) {
  const attempts = [];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    attempts.push(await inspectOnce(source));
  }
  return {
    slug: source.slug,
    name: source.name,
    feed_url: source.feed_url,
    passed: attempts.every((attempt) => attempt.ok),
    attempts,
  };
}

const discoveredCandidates = [
  {
    slug: 'ville-saint-gaudens-actualites', name: 'Ville de Saint-Gaudens — actualités',
    feed_url: 'https://www.stgo.fr/actualites/feed/', default_zone: 'functional_ring',
    default_locality: 'Saint-Gaudens', requires_keyword: false,
  },
  {
    slug: 'parc-national-pyrenees-official', name: 'Parc national des Pyrénées — flux déclaré',
    feed_url: 'https://www.pyrenees-parcnational.fr/fr/flux/rss.xml', default_zone: 'functional_ring',
    default_locality: 'Pyrénées', requires_keyword: true,
  },
  {
    slug: 'ville-luchon', name: 'Ville de Luchon', feed_url: 'https://www.mairie-luchon.fr/feed/',
    default_zone: 'core', default_locality: 'Luchonnais', requires_keyword: false,
  },
  {
    slug: 'cc-pyrenees-haut-garonnaises', name: 'Pyrénées Haut Garonnaises',
    feed_url: 'https://cc-pyreneeshautgaronnaises.fr/communaute/s-informer/actualites?format=feed&type=rss',
    default_zone: 'core', default_locality: 'Pyrénées Haut Garonnaises', requires_keyword: false,
  },
  {
    slug: 'inforoute65', name: 'InfoRoute65', feed_url: 'https://inforoute.ha-py.fr/feed/',
    default_zone: 'functional_ring', default_locality: 'Hautes-Pyrénées', requires_keyword: true,
  },
  {
    slug: 'ch-comminges-pyrenees', name: 'Centre Hospitalier Comminges Pyrénées',
    feed_url: 'https://www.ch-saintgaudens.fr/feed/', default_zone: 'functional_ring',
    default_locality: 'Saint-Gaudens', requires_keyword: false,
  },
  {
    slug: 'hopitaux-lannemezan', name: 'Hôpitaux de Lannemezan',
    feed_url: 'https://www.ch-lannemezan.fr/?feed=rss2', default_zone: 'functional_ring',
    default_locality: 'Lannemezan', requires_keyword: false,
  },
  {
    slug: 'agriculture-pyrenees', name: 'Agriculture Pyrénées',
    feed_url: 'https://agriculturepyrenees.fr/feed/', default_zone: 'core',
    default_locality: 'Massif des Pyrénées', requires_keyword: true,
  },
  {
    slug: 'ici-france-bleu', name: 'ICI', feed_url: 'https://www.radiofrance.fr/francebleu/rss',
    default_zone: 'functional_ring', default_locality: 'Occitanie', requires_keyword: true,
  },
];

const standardProbeCandidates = [
  ['cc-coeur-coteaux-comminges', 'Cœur & Coteaux Comminges', 'https://www.coeurcoteaux-comminges.fr/feed/', 'core', 'Comminges', false],
  ['ville-montrejeau', 'Ville de Montréjeau', 'https://www.mairie-montrejeau.com/feed/', 'functional_ring', 'Montréjeau', false],
  ['ville-lannemezan-root', 'Ville de Lannemezan', 'https://lannemezan.fr/feed/', 'functional_ring', 'Lannemezan', false],
  ['ville-lannemezan-fr', 'Ville de Lannemezan', 'https://lannemezan.fr/fr/feed/', 'functional_ring', 'Lannemezan', false],
  ['atmo-occitanie-root', 'Atmo Occitanie', 'https://www.atmo-occitanie.org/rss.xml', 'functional_ring', 'Occitanie', true],
  ['atmo-occitanie-news', 'Atmo Occitanie', 'https://www.atmo-occitanie.org/actualites/rss.xml', 'functional_ring', 'Occitanie', true],
  ['lio-occitanie-root', 'liO Occitanie', 'https://www.lio-occitanie.fr/feed/', 'functional_ring', 'Occitanie', true],
  ['lio-occitanie-news', 'liO Occitanie', 'https://www.lio-occitanie.fr/actualites/feed/', 'functional_ring', 'Occitanie', true],
  ['departement-haute-garonne-root', 'Département de la Haute-Garonne', 'https://www.haute-garonne.fr/rss.xml', 'functional_ring', 'Haute-Garonne', true],
  ['departement-haute-garonne-news', 'Département de la Haute-Garonne', 'https://www.haute-garonne.fr/actualites/rss.xml', 'functional_ring', 'Haute-Garonne', true],
  ['region-occitanie-backend', 'Région Occitanie', 'https://www.laregion.fr/spip.php?page=backend', 'functional_ring', 'Occitanie', true],
  ['region-occitanie-news', 'Région Occitanie', 'https://www.laregion.fr/spip.php?page=backend-actu', 'functional_ring', 'Occitanie', true],
  ['sdis31-root', 'SDIS 31', 'https://www.sdis31.fr/feed/', 'functional_ring', 'Haute-Garonne', true],
  ['sdis65-root', 'SDIS 65', 'https://www.sdis65.fr/feed/', 'functional_ring', 'Hautes-Pyrénées', true],
  ['france3-occitanie-rss', 'France 3 Occitanie', 'https://france3-regions.franceinfo.fr/occitanie/rss', 'functional_ring', 'Occitanie', true],
  ['france3-occitanie-xml', 'France 3 Occitanie', 'https://france3-regions.franceinfo.fr/occitanie/rss.xml', 'functional_ring', 'Occitanie', true],
  ['ars-occitanie', 'ARS Occitanie', 'https://www.occitanie.ars.sante.fr/rss.xml', 'functional_ring', 'Occitanie', true],
  ['chambre-agriculture-31', 'Chambre d’agriculture de la Haute-Garonne', 'https://hautegaronne.chambres-agriculture.fr/feed/', 'core', 'Haute-Garonne', true],
  ['chambre-agriculture-65', 'Chambre d’agriculture des Hautes-Pyrénées', 'https://hapy.chambres-agriculture.fr/feed/', 'functional_ring', 'Hautes-Pyrénées', true],
].map(([slug, name, feed_url, default_zone, default_locality, requires_keyword]) => ({
  slug, name, feed_url, default_zone, default_locality, requires_keyword,
}));

const sources = process.argv.includes('--discovered')
  ? discoveredCandidates
  : process.argv.includes('--probes')
    ? standardProbeCandidates
    : registry.sources.filter((source) => source.active && source.automation === 'rss');
const results = await Promise.all(sources.map(verifySource));
const summary = {
  checked_at: new Date().toISOString(),
  runs_per_source: 2,
  timeout_ms: TIMEOUT_MS,
  sources_checked: results.length,
  sources_passed: results.filter((result) => result.passed).length,
  sources_failed: results.filter((result) => !result.passed).length,
  results,
};

console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.sources_failed === 0 ? 0 : 1;
