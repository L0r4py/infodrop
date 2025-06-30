// api/sitemap-parser.js
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const SOURCES = [
  {
    name: "Elysée",
    url: "https://www.elysee.fr/sitemap.publication.xml"
  },
  {
    name: "InfoGouv",
    url: "https://www.info.gouv.fr/rss/actualites.xml"
  }
];

export default async function handler(req, res) {
  try {
    let allArticles = [];
    for (const source of SOURCES) {
      let articles = [];
      if (source.url.endsWith(".xml")) {
        const response = await axios.get(source.url, { timeout: 10000 });
        const data = await parseStringPromise(response.data);

        // Cas RSS classique (exemple InfoGouv)
        if (data.rss && data.rss.channel) {
          const items = data.rss.channel[0].item || [];
          articles = items.map(item => ({
            title: item.title[0],
            url: item.link[0],
            source: source.name,
            published_at: item.pubDate ? new Date(item.pubDate[0]).toISOString() : new Date().toISOString()
          }));
        }

        // Cas sitemap (exemple Elysée)
        if (data.urlset && data.urlset.url) {
          articles = data.urlset.url.map(entry => ({
            title: entry['image:image'] && entry['image:image'][0]['image:title']
              ? entry['image:image'][0]['image:title'][0]
              : entry.loc[0],
            url: entry.loc[0],
            source: source.name,
            published_at: entry.lastmod ? entry.lastmod[0] : new Date().toISOString()
          }));
        }
      }
      allArticles = allArticles.concat(articles);
    }

    // Ici, tu peux insérer dans Supabase ou retourner direct :
    // await insertArticlesToSupabase(allArticles); // à coder

    res.status(200).json({
      count: allArticles.length,
      articles: allArticles
    });
  } catch (error) {
    console.error('Erreur parsing sitemap:', error);
    res.status(500).json({ error: error.message });
  }
}
