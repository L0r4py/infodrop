import { parseHTML } from 'linkedom';

function exactDate(value) {
  // Une date sans heure ni fuseau ne permet pas de prouver un instant de publication.
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function parisienUrlDate(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['www.leparisien.fr', 'leparisien.fr'].includes(url.hostname)) return null;
    // Le format courant -JJ-MM-AAAA-ID.php ne contient pas d'heure : aucun minuit inventé.
    const match = decodeURIComponent(url.pathname).match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})/);
    return match ? exactDate(match[0]) : null;
  } catch { return null; }
}

export function parisienPageDate(html) {
  const { document } = parseHTML(html);
  const dates = [];
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const types = [value['@type']].flat();
    if (types.some(type => /^(NewsArticle|Article|ReportageNewsArticle|AnalysisNewsArticle|BlogPosting)$/.test(type))) {
      const date = exactDate(value.datePublished);
      if (date) dates.push(date);
    }
    if (value['@graph']) visit(value['@graph']);
    if (value.mainEntity) visit(value.mainEntity);
  }
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try { visit(JSON.parse(script.textContent)); } catch { /* JSON invalide : pas de date inventée. */ }
  }
  const meta = exactDate(document.querySelector('meta[property="article:published_time"]')?.getAttribute('content'));
  if (meta) dates.push(meta);
  const unique = [...new Set(dates.map(date => date.toISOString()))];
  return unique.length === 1 ? new Date(unique[0]) : null;
}

export async function resolveParisienDate(url, fetchPage = fetch) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !['www.leparisien.fr', 'leparisien.fr'].includes(parsed.hostname)) return null;
    const fromUrl = parisienUrlDate(url);
    if (fromUrl) return fromUrl;
    const response = await fetchPage(url, {
      redirect: 'error', signal: AbortSignal.timeout(4000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Infodrop/1.0; +https://infodrop.live/)' },
    });
    if (!response.ok) { await response.body?.cancel(); return null; }
    return parisienPageDate(await response.text());
  } catch { return null; }
}
