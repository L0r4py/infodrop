import { parseHTML } from 'linkedom';

// Routes publiques déclarées par https://www.tarbes.fr/wp-json/.
// Les deux collections correspondent aux actualités et agendas présents dans le RSS.
const COLLECTIONS = ['actualite', 'evenement'];

export async function fetchTarbesPublicFeed(headers = {}) {
  const collections = await Promise.all(COLLECTIONS.map(async (collection) => {
    const url = new URL(`https://www.tarbes.fr/wp-json/wp/v2/${collection}`);
    url.searchParams.set('per_page', '100');
    url.searchParams.set('orderby', 'date');
    url.searchParams.set('order', 'desc');
    url.searchParams.set('_fields', 'link,title,date_gmt,status');
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { ...headers, Accept: 'application/json' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`API officielle Tarbes (${collection}) : HTTP ${response.status}`);
    }
    const posts = await response.json();
    if (!Array.isArray(posts)) throw new Error(`API officielle Tarbes (${collection}) : réponse invalide`);
    return posts.filter(post => {
      if (post.status !== 'publish') return false;
      try {
        const link = new URL(post.link);
        return link.protocol === 'https:' && link.hostname === 'www.tarbes.fr'
          && link.pathname.startsWith(`/${collection}/`);
      } catch { return false; }
    }).map(post => {
      // date_gmt est la publication UTC WordPress, pas la modification ni la date de l'événement.
      const rawDate = String(post.date_gmt || '');
      const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/.test(rawDate)
        ? new Date(rawDate.endsWith('Z') ? rawDate : `${rawDate}Z`)
        : null;
      const { document } = parseHTML(`<html><body>${post.title?.rendered || ''}</body></html>`);
      return {
        title: document.body.textContent,
        link: post.link,
        isoDate: date && Number.isFinite(date.getTime()) ? date.toISOString() : null,
      };
    });
  }));
  return { items: collections.flat() };
}
