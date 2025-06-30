// Fichier : /api/test-scraper.js
// Endpoint pour tester une configuration de scraping

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
    
    const { url, type, selectors } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL requise' });
    }
    
    console.log(`🧪 Test de scraping pour ${url}`);
    
    try {
        let result;
        
        if (type === 'twitter') {
            // Test simple pour Twitter
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
            // Test pour site web classique
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
            
            // Utiliser les sélecteurs fournis ou les defaults
            const articleSelector = selectors?.articles || 'article, .article, .post, .news-item';
            const titleSelector = selectors?.title || 'h1, h2, h3, .title, .headline';
            const linkSelector = selectors?.link || 'a';
            
            const articles = [];
            $(articleSelector).each((index, element) => {
                if (index >= 3) return; // Limiter à 3 pour le test
                
                const $article = $(element);
                const title = $article.find(titleSelector).first().text().trim();
                const link = $article.find(linkSelector).first().attr('href');
                
                if (title) {
                    articles.push({
                        title: title.substring(0, 180),
                        url: link ? new URL(link, url).href : url,
                        content: $article.text().substring(0, 200).trim()
                    });
                }
            });
            
            if (articles.length === 0) {
                // Essayer une approche plus générale
                $('a').each((index, element) => {
                    if (index >= 5) return;
                    const $link = $(element);
                    const text = $link.text().trim();
                    const href = $link.attr('href');
                    
                    if (text.length > 20 && href && !href.startsWith('#')) {
                        articles.push({
                            title: text.substring(0, 180),
                            url: new URL(href, url).href,
                            content: 'Contenu détecté via analyse générique'
                        });
                    }
                });
            }
            
            result = {
                success: articles.length > 0,
                message: articles.length > 0 
                    ? `${articles.length} articles trouvés avec les sélecteurs ${selectors ? 'personnalisés' : 'par défaut'}`
                    : 'Aucun article trouvé. Essayez des sélecteurs personnalisés.',
                articles: articles.slice(0, 3),
                suggestions: articles.length === 0 ? {
                    selectors_found: {
                        articles: Array.from(new Set(
                            $('*').map((i, el) => el.tagName.toLowerCase())
                                  .get()
                                  .filter(tag => ['article', 'section', 'div', 'li'].includes(tag))
                        )).slice(0, 5),
                        titles: Array.from(new Set(
                            $('h1, h2, h3, h4').map((i, el) => el.tagName.toLowerCase()).get()
                        ))
                    }
                } : null
            };
        }
        
        console.log(`✅ Test réussi: ${result.articles?.length || 0} articles trouvés`);
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