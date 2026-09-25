import { parseHTML } from 'linkedom';
import registry from '../public/config/sources-pyrenees.json' with { type: 'json' };

async function discover(source) {
  const startedAt = Date.now();
  try {
    const response = await fetch(source.homepage_url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'infodrop.live feed discovery/1.0 (+https://infodrop.live/)' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const { document } = parseHTML(html);
    const discovered = [...document.querySelectorAll('link[rel~="alternate"]')]
      .filter((link) => /rss|atom|feed|xml/i.test(`${link.getAttribute('type') || ''} ${link.getAttribute('title') || ''}`))
      .map((link) => {
        try {
          return new URL(link.getAttribute('href'), response.url).toString();
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    return {
      slug: source.slug,
      name: source.name,
      homepage_url: source.homepage_url,
      final_url: response.url,
      duration_ms: Date.now() - startedAt,
      feeds: [...new Set(discovered)],
      error: null,
    };
  } catch (error) {
    return {
      slug: source.slug,
      name: source.name,
      homepage_url: source.homepage_url,
      duration_ms: Date.now() - startedAt,
      feeds: [],
      error: String(error?.message || error),
    };
  }
}

const candidates = process.argv.includes('--all')
  ? registry.sources
  : registry.sources.filter((source) => !source.active);
const results = await Promise.all(candidates.map(discover));
console.log(JSON.stringify({
  checked_at: new Date().toISOString(),
  candidates_checked: results.length,
  feeds_discovered: results.filter((result) => result.feeds.length > 0).length,
  results,
}, null, 2));
