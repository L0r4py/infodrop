// api/sitemap-parser.js
const axios = require('axios');
const xml2js = require('xml2js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SOURCES = [
  {
    name: "Élysée",
    url: "https://www.elysee.fr/sitemap.publication.xml",
    source: "elysee.fr"
  },
  {
    name: "Gouvernement",
    url: "https://www.info.gouv.fr/rss/actualites.xml",
    source: "info.gouv.fr"
  }
  // Ajoute ici d'autres flux/sitemaps institutionnels si besoin
];

async function parseElyseeSitemap(sitemapUrl) {
  const res = await axios.get(sitemapUrl);
  const parsed = await xml2js.parseStringPromise(res.data);
  const urls = parsed.urlset.url.map(item => ({
    url: item.loc[0],
    published_at: item.lastmod ? item.lastmod[0] : null,
    title: item.loc[0].split('/').slice(-1)[0].replace(/-/g, ' ').replace(/\.[^/.]+$/, ""),
  }));
  return urls;
}

async function parseRssFeed(feedUrl) {
  const res = await axios.get(feedUrl);
  const parsed = await xml2js.parseStringPromise(res.data);
  const items = parsed.rss.channel[0].item.map(item => ({
    url: item.link[0],
    published_at: item.pubDate ? new Date(item.pubDate[0]).toISOString() : null,
    title: item.title[0],
  }));
  return items;
}

async function main() {
  for (const src of SOURCES) {
    let articles = [];
    try {
      if (src.url.includes("sitemap")) {
        // sitemap XML style Elysee
        articles = await parseElyseeSitemap(src.url);
      } else if (src.url.endsWith(".xml")) {
        // RSS classique style info.gouv
        articles = await parseRssFeed(src.url);
      }
      // Injection Supabase
      for (const article of articles) {
        await supabase
          .from('scraped_articles')
          .upsert({
            source_id: src.source, // à adapter à ta logique ou mettre l’ID source si tu en as un dans ta table
            url: article.url,
            title: article.title,
            published_at: article.published_at || new Date().toISOString(),
            scraped_at: new Date().toISOString()
          }, { onConflict: 'url' });
      }
      console.log(`✅ ${src.name} : ${articles.length} articles traités`);
    } catch (err) {
      console.error(`❌ Erreur pour ${src.name} :`, err.message);
    }
  }
}

main().then(() => process.exit(0));
