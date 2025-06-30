// /api/sitemap-parser.js

import fetch from 'node-fetch';
import cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { sitemapUrl, sourceName = "Elysée" } = req.body;
  if (!sitemapUrl) return res.status(400).json({ error: "Paramètre sitemapUrl manquant" });

  // Helper pour parser du XML rapidement
  function getTagValues(xml, tag) {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, "g");
    const matches = [];
    let match;
    while ((match = regex.exec(xml))) {
      matches.push(match[1]);
    }
    return matches;
  }

  // Etape 1 : Charger le sitemap index ou un sitemap d’urls
  const xml = await fetch(sitemapUrl).then(r => r.text());

  let sitemapUrls = [];
  if (xml.includes('<sitemapindex')) {
    // Index de sitemap → on extrait tous les <loc>
    sitemapUrls = getTagValues(xml, 'loc');
  } else if (xml.includes('<urlset')) {
    sitemapUrls = [sitemapUrl];
  } else {
    return res.status(400).json({ error: "Fichier XML non reconnu comme sitemap" });
  }

  let results = [];

  for (let smUrl of sitemapUrls) {
    const sitemapXml = await fetch(smUrl).then(r => r.text());
    const urls = getTagValues(sitemapXml, 'loc');
    const lastmods = getTagValues(sitemapXml, 'lastmod');

    for (let i = 0; i < urls.length; i++) {
      const articleUrl = urls[i];
      let title = "";
      try {
        // On va chercher le <title> de la page
        const html = await fetch(articleUrl).then(r => r.text());
        const $ = cheerio.load(html);
        title = $("title").first().text().trim();
      } catch (e) {
        title = articleUrl; // fallback
      }
      results.push({
        title,
        url: articleUrl,
        published_at: lastmods[i] || new Date().toISOString(),
        source: sourceName
      });
    }
  }

  // Insertion en BDD
  let insertions = [];
  for (let article of results) {
    try {
      const { error } = await supabase.from('scraped_articles').insert({
        title: article.title,
        url: article.url,
        published_at: article.published_at,
        content: null,
        source_id: null // tu peux relier à l’id d’une source si tu veux
      });
      if (!error) insertions.push(article);
    } catch (err) {}
  }

  res.json({
    nb_articles: results.length,
    nb_inserted: insertions.length,
    inserted: insertions.map(a => a.url)
  });
};
