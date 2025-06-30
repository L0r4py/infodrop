// /api/sitemap-parser.js
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// ⚠️ Mets ici tes propres clés (utilise une clé service_role si tu veux bypasser RLS et être peinard)
const SUPABASE_URL = process.env.SUPABASE_URL || "https://xxxxx.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGci..."; // service_role !!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SOURCES = [
  'https://www.info.gouv.fr/rss/actualites.xml',
  'https://www.elysee.fr/sitemap.publication.xml'
];

export default async function handler(req, res) {
  try {
    let allItems = [];

    for (const url of SOURCES) {
      const { data } = await axios.get(url, { timeout: 10000 });
      // RSS ?
      if (data.includes('<rss') || data.includes('<feed')) {
        const items = parseRSS(data, url);
        allItems.push(...items);
      }
      // Sitemap XML
      else if (data.includes('<urlset')) {
        const items = parseSitemap(data, url);
        allItems.push(...items);
      }
    }

    // On ne garde que les nouveaux articles (ceux dont le lien n'est pas déjà présent)
    const newItems = [];
    for (const article of allItems) {
      const { data: existing, error } = await supabase
        .from('scraped_articles')
        .select('id')
        .eq('url', article.link)
        .maybeSingle();

      if (!existing) {
        newItems.push(article);
        // Insère direct dans Supabase
        await supabase.from('scraped_articles').insert([{
          source_id: null, // Si tu veux relier à une source, à adapter !
          title: article.title || article.link,
          url: article.link,
          content: '', // Pas dispo dans RSS/Sitemap de base
          published_at: article.pubDate || article.lastmod || null,
          scraped_at: new Date().toISOString(),
          inserted_to_main: false
        }]);
      }
    }

    res.status(200).json({
      success: true,
      inserted: newItems.length,
      details: newItems
    });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
}

function parseRSS(xml, source) {
  const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  return matches.map(match => {
    const title = (match[1].match(/<title>(.*?)<\/title>/) || [])[1] || '';
    const link = (match[1].match(/<link>(.*?)<\/link>/) || [])[1] || '';
    const pubDate = (match[1].match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
    return { source, title, link, pubDate };
  });
}

function parseSitemap(xml, source) {
  const matches = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)];
  return matches.map(match => {
    const loc = (match[1].match(/<loc>(.*?)<\/loc>/) || [])[1] || '';
    const lastmod = (match[1].match(/<lastmod>(.*?)<\/lastmod>/) || [])[1] || '';
    return { source, title: '', link: loc, lastmod };
  });
}
