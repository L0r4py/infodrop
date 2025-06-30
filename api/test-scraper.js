// /api/test-scraper.js
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Vérifier l'authentification
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user || !['l0r4.py@gmail.com'].includes(user.email)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { url, type, selectors: customSelectors } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL requise' });
    }
    
    console.log(`🧪 Test de scraping pour ${url}`);
    
    try {
        let result;

        if (type === 'twitter') {
            // Twitter (Nitter)
            const username = url.match(/(?:twitter\.com|x\.com)\/([^\/]+)/)?.[1];
            if (!username) {
                return res.status(400).json({ error: 'URL Twitter invalide' });
            }
            result = {
                success: true,
                message: `Compte Twitter @${username} détecté. Le scraping utilisera Nitter.`,
                articles: [
                    {
                        title: `Tweet de test de @${username}`,
                        url: url,
                        content: 'Ceci est un exemple de tweet qui sera récupéré.'
                    }
                ]
            };
        } else {
            // --------- 1. Sélecteurs CSS -------------
            let selectors = customSelectors;

            // Si pas de sélecteurs custom, tente de charger le template en base
            if (!selectors || !selectors.articles) {
                const { data: templates, error } = await supabase
                    .from('scraping_templates')
                    .select('site_pattern,selectors')
                    .order('created_at', { ascending: false });

                if (error) throw new Error("Erreur chargement templates");

                const tpl = templates?.find(t => url.startsWith(t.site_pattern));
                if (tpl) {
                    selectors = tpl.selectors;
                    if (typeof selectors === 'string') selectors = JSON.parse(selectors);
                }
            }

            // Toujours rien : abort
            if (!selectors || !selectors.articles) {
                return res.status(400).json({ error: 'Aucun sélecteur CSS trouvé pour ce site.' });
            }

            // --------- 2. Scrap ---------
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            const $ = cheerio.load(html);

            const articleSelector = selectors.articles;
            const titleSelector = selectors.title || 'h1, h2, h3';
            const linkSelector = selectors.link || 'a';
            const dateSelector = selectors.date || 'time';
            const summarySelector = selectors.summary || '';

            const articles = [];
            $(articleSelector).each((index, element) => {
                if (index >= 3) return; // Limiter à 3 pour le test
                const $article = $(element);

                const title = titleSelector ? $article.find(titleSelector).first().text().trim() : '';
                const link = linkSelector ? $article.find(linkSelector).first().attr('href') : '';
                const date = dateSelector ? $article.find(dateSelector).first().text().trim() : '';
                const summary = summarySelector ? $article.find(summarySelector).first().text().trim() : '';

                if (title && link) {
                    articles.push({
                        title: title.substring(0, 180),
                        url: link.startsWith('http') ? link : new URL(link, url).href,
                        date,
                        summary
                    });
                }
            });

            result = {
                success: articles.length > 0,
                message: articles.length > 0 
                    ? `${articles.length} articles trouvés avec le template adapté` 
                    : 'Aucun article trouvé. Vérifiez les sélecteurs CSS.',
                articles: articles.slice(0, 3)
            };
        }

        console.log(`✅ Test scraping : ${result.articles?.length || 0} articles trouvés`);
        res.status(200).json(result);

    } catch (error) {
        console.error('❌ Erreur test scraping:', error);
        res.status(200).json({
            success: false,
            error: error.message,
            message: 'Impossible de récupérer le contenu. Vérifiez l\'URL ou essayez des sélecteurs personnalisés.'
        });
    }
}
