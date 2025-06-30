// Fichier : /api/custom-scraper.js
// Module de scraping pour créer des flux RSS personnalisés

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Scraper pour sites web classiques
async function scrapeWebsite(source) {
    const { url, selector_config } = source;
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const articles = [];
        const selectors = selector_config || {};
        
        // Sélecteurs par défaut si non fournis
        const articleSelector = selectors.articles || 'article, .article, .post, .news-item, .entry, [class*="article"], [class*="post"]';
        const titleSelector = selectors.title || 'h1, h2, h3, .title, .headline, [class*="title"], [class*="headline"]';
        const linkSelector = selectors.link || 'a[href]';
        const dateSelector = selectors.date || 'time, .date, .published, [class*="date"], [datetime]';
        const summarySelector = selectors.summary || '.summary, .excerpt, .intro, p:first';
        
        $(articleSelector).each((index, element) => {
            if (index >= 15) return; // Limiter à 15 articles
            
            const $article = $(element);
            
            // Chercher le titre
            let title = $article.find(titleSelector).first().text().trim();
            if (!title) {
                // Essayer de trouver un titre dans les liens
                title = $article.find('a').first().text().trim();
            }
            
            // Chercher le lien
            const linkElement = $article.find(linkSelector).first();
            let articleUrl = linkElement.attr('href');
            
            // Construire l'URL complète si nécessaire
            if (articleUrl && !articleUrl.startsWith('http')) {
                const baseUrl = new URL(url);
                articleUrl = new URL(articleUrl, baseUrl.origin).href;
            }
            
            // Chercher la date
            const dateElement = $article.find(dateSelector).first();
            let dateText = dateElement.attr('datetime') || dateElement.text().trim();
            
            // Chercher un résumé
            const summary = $article.find(summarySelector).first().text().trim();
            
            if (title && articleUrl && title.length > 10) {
                articles.push({
                    title: title.substring(0, 180),
                    url: articleUrl,
                    content: summary || title,
                    published_at: parseDate(dateText) || new Date().toISOString()
                });
            }
        });
        
        // Si aucun article trouvé avec les sélecteurs, essayer une approche plus générale
        if (articles.length === 0) {
            console.log('Aucun article avec sélecteurs, essai approche générale...');
            
            $('a').each((index, element) => {
                if (index >= 20 || articles.length >= 10) return;
                
                const $link = $(element);
                const href = $link.attr('href');
                const text = $link.text().trim();
                
                // Filtrer les liens non pertinents
                if (href && 
                    text.length > 30 && 
                    !href.startsWith('#') &&
                    !href.includes('javascript:') &&
                    !text.match(/^(Menu|Contact|Connexion|S'abonner|Newsletter)/i)) {
                    
                    const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
                    
                    articles.push({
                        title: text.substring(0, 180),
                        url: fullUrl,
                        content: text,
                        published_at: new Date().toISOString()
                    });
                }
            });
        }
        
        return { success: true, articles };
        
    } catch (error) {
        console.error(`Erreur scraping ${url}:`, error);
        return { success: false, error: error.message, articles: [] };
    }
}

// Scraper pour Twitter/X via Nitter
async function scrapeTwitter(source) {
    const { url } = source;
    
    // Extraire le username
    const username = url.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/)?.[1];
    
    if (!username) {
        return { success: false, error: 'Username Twitter invalide', articles: [] };
    }
    
    // Instances Nitter (mises à jour régulièrement)
    const nitterInstances = [
        'https://nitter.poast.org',
        'https://nitter.privacydev.net',
        'https://nitter.projectsegfau.lt',
        'https://nitter.1d4.us',
        'https://n.opnxng.com'
    ];
    
    for (const instance of nitterInstances) {
        try {
            console.log(`Essai Nitter: ${instance}/${username}`);
            
            const nitterUrl = `${instance}/${username}`;
            const response = await fetch(nitterUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; InfodropBot/1.0)'
                },
                timeout: 10000
            });
            
            if (!response.ok) continue;
            
            const html = await response.text();
            const $ = cheerio.load(html);
            
            const articles = [];
            
            // Sélecteurs Nitter
            $('.timeline-item').each((index, element) => {
                if (index >= 10) return;
                
                const $tweet = $(element);
                
                // Contenu du tweet
                const content = $tweet.find('.tweet-content').text().trim();
                
                // Date
                const dateLink = $tweet.find('.tweet-date a');
                const dateText = dateLink.attr('title') || dateLink.text();
                
                // Lien vers le tweet original
                const tweetPath = dateLink.attr('href');
                const tweetUrl = tweetPath ? `https://twitter.com${tweetPath.replace('/i/web', '')}` : null;
                
                if (content && content.length > 20 && tweetUrl) {
                    articles.push({
                        title: content.substring(0, 180),
                        url: tweetUrl,
                        content: content,
                        published_at: parseDate(dateText) || new Date().toISOString()
                    });
                }
            });
            
            if (articles.length > 0) {
                console.log(`✅ ${articles.length} tweets récupérés via ${instance}`);
                return { success: true, articles };
            }
            
        } catch (error) {
            console.error(`Erreur Nitter ${instance}:`, error.message);
            continue;
        }
    }
    
    return { 
        success: false, 
        error: 'Aucune instance Nitter disponible. Twitter nécessite une API payante.', 
        articles: [] 
    };
}

// Parser de dates flexible
function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Essayer le parsing direct
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date.toISOString();
    
    // Formats français courants
    const patterns = [
        { regex: /il y a (\d+) minute/i, unit: 'minutes' },
        { regex: /il y a (\d+) heure/i, unit: 'hours' },
        { regex: /il y a (\d+) jour/i, unit: 'days' },
        { regex: /(\d+) min/i, unit: 'minutes' },
        { regex: /(\d+)h/i, unit: 'hours' },
        { regex: /(\d+)j/i, unit: 'days' }
    ];
    
    for (const pattern of patterns) {
        const match = dateStr.match(pattern.regex);
        if (match) {
            const amount = parseInt(match[1]);
            const now = new Date();
            
            switch (pattern.unit) {
                case 'minutes':
                    now.setMinutes(now.getMinutes() - amount);
                    break;
                case 'hours':
                    now.setHours(now.getHours() - amount);
                    break;
                case 'days':
                    now.setDate(now.getDate() - amount);
                    break;
            }
            
            return now.toISOString();
        }
    }
    
    return new Date().toISOString();
}

// Handler principal
export default async function handler(req, res) {
    // Vérification de sécurité
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        
        // Mode manuel pour les admins
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            const { data: { user } } = await supabase.auth.getUser(token);
            
            if (!user || !['l0r4.py@gmail.com'].includes(user.email)) {
                return res.status(401).json({ error: 'Non autorisé' });
            }
        } else {
            return res.status(401).json({ error: 'Token requis' });
        }
    }
    
    console.log('🔍 Démarrage du scraping personnalisé');
    
    try {
        // Si une source spécifique est demandée
        let sources;
        if (req.body?.source_id) {
            const { data, error } = await supabase
                .from('custom_sources')
                .select('*')
                .eq('id', req.body.source_id)
                .single();
            
            if (error || !data) {
                return res.status(404).json({ error: 'Source non trouvée' });
            }
            sources = [data];
        } else {
            // Sinon, toutes les sources actives
            const { data, error } = await supabase
                .from('custom_sources')
                .select('*')
                .eq('is_active', true)
                .or(`last_checked.is.null,last_checked.lt.${new Date(Date.now() - 30 * 60000).toISOString()}`);
            
            if (error) throw error;
            sources = data || [];
        }
        
        const results = [];
        let totalNewArticles = 0;
        
        for (const source of sources) {
            console.log(`📡 Scraping ${source.name} (${source.type})...`);
            
            let result;
            if (source.type === 'twitter') {
                result = await scrapeTwitter(source);
            } else {
                result = await scrapeWebsite(source);
            }
            
            // Mettre à jour le statut
            await supabase
                .from('custom_sources')
                .update({
                    last_checked: new Date().toISOString(),
                    last_error: result.success ? null : result.error
                })
                .eq('id', source.id);
            
            if (result.success && result.articles.length > 0) {
                let newCount = 0;
                
                for (const article of result.articles) {
                    try {
                        // Vérifier si existe déjà
                        const { data: existing } = await supabase
                            .from('scraped_articles')
                            .select('id')
                            .eq('url', article.url)
                            .single();
                        
                        if (!existing) {
                            // Insérer dans scraped_articles
                            await supabase
                                .from('scraped_articles')
                                .insert({
                                    source_id: source.id,
                                    title: article.title,
                                    url: article.url,
                                    content: article.content,
                                    published_at: article.published_at
                                });
                            
                            // Insérer dans la table principale
                            await supabase
                                .from('actu')
                                .insert({
                                    resume: article.title,
                                    source: source.name,
                                    url: article.url,
                                    heure: article.published_at,
                                    orientation: source.orientation
                                });
                            
                            newCount++;
                            totalNewArticles++;
                        }
                    } catch (err) {
                        // Ignorer les doublons
                        if (!err.message?.includes('duplicate')) {
                            console.error(`Erreur insertion:`, err.message);
                        }
                    }
                }
                
                results.push({
                    source: source.name,
                    success: true,
                    articles_found: result.articles.length,
                    new_articles: newCount
                });
            } else {
                results.push({
                    source: source.name,
                    success: false,
                    error: result.error || 'Aucun article trouvé'
                });
            }
        }
        
        console.log(`✅ Scraping terminé: ${totalNewArticles} nouveaux articles`);
        res.status(200).json({
            success: true,
            sources_processed: results.length,
            total_new_articles: totalNewArticles,
            results
        });
        
    } catch (error) {
        console.error('❌ Erreur globale:', error);
        res.status(500).json({ error: error.message });
    }
}