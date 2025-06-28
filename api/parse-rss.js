// Fichier : /api/parse-rss.js
// Version 14 - Ajout du filtrage par mots-clés

import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const parser = new Parser({
    timeout: 10000,
    headers: { 'User-Agent': 'INFODROP RSS Parser/1.0' }
});

// La liste des flux RSS ne change pas
const RSS_FEEDS = [
    { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss' },
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml' },
    { name: 'Libération', url: 'https://www.liberation.fr/arc/outboundfeeds/rss-all/?outputType=xml' },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml' },
    { name: 'Le Parisien', url: 'https://feeds.leparisien.fr/leparisien/rss' },
    { name: 'Ouest France', url: 'https://www.ouest-france.fr/rss-en-continu.xml' },
    { name: 'Courrier International', url: 'https://www.courrierinternational.com/feed/all/rss.xml' },
    { name: 'France Inter', url: 'https://www.radiofrance.fr/franceinter/rss' },
    { name: 'France Culture', url: 'https://www.radiofrance.fr/franceculture/rss' },
    { name: 'Futura Sciences', url: 'https://www.futura-sciences.com/rss/actualites.xml' },
    { name: 'Sciences et Avenir', url: 'https://www.sciencesetavenir.fr/rss.xml' },
    { name: 'Konbini', url: 'https://www.konbini.com/fr/feed/' },
    { name: 'Numerama', url: 'https://www.numerama.com/feed/' },
    { name: "L'Obs", url: 'https://www.nouvelobs.com/rss.xml' },
    { name: 'Reporterre', url: 'https://reporterre.net/spip.php?page=backend' },
    { name: 'Blast', url: 'https://api.blast-info.fr/rss.xml' },
    { name: 'Arrêt sur Images', url: 'https://api.arretsurimages.net/api/public/rss/all-content' },
    { name: 'Mayotte Hebdo', url: 'https://mayottehebdo.com/feed/' },
    { name: 'L\'Info Kwezi', url: 'https://www.linfokwezi.fr/feed/' }
];

// --- NOUVEAU : LES RÈGLES DE FILTRAGE ---
// Ici, on définit les mots-clés à bloquer pour chaque source.
const FILTER_RULES = {
    'Le Parisien': ['météo', 'horoscope'] // On bloque les articles contenant "météo" OU "horoscope"
    // Tu pourras ajouter d'autres règles ici, par exemple :
    // 'Le Figaro': ['bourse', 'immobilier']
};
// --- FIN DES NOUVELLES RÈGLES ---

function createSummary(text) {
    if (!text) return '';
    const replacements = { '’': "'", '–': '-', '…': '...', '"': '"', '&': '&', '<': '<', '>': '>' };
    let cleanText = text.replace(/(&#?[a-z0-9]+;)/gi, (match) => replacements[match] || '');
    cleanText = cleanText.replace(/<[^>]*>/g, ' ').replace(/\s\s+/g, ' ').trim();
    if (cleanText.length > 180) { cleanText = cleanText.substring(0, 177) + '...'; }
    return cleanText;
}

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) { return res.status(401).json({ error: 'Unauthorized' }); }
    console.log('🚀 Démarrage du parsing RSS INFODROP (v14 - Keyword Filtering)');
    let articlesToInsert = [];
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    for (const feed of RSS_FEEDS) {
        try {
            const feedData = await parser.parseURL(feed.url);
            for (const item of feedData.items) {
                // --- NOUVEAU : LA LOGIQUE DE FILTRAGE ---
                const keywordsToBlock = FILTER_RULES[feed.name];
                if (keywordsToBlock) {
                    const title = (item.title || '').toLowerCase();
                    const hasBlockedKeyword = keywordsToBlock.some(keyword => title.includes(keyword));
                    if (hasBlockedKeyword) {
                        // Si on trouve un mot-clé bloqué, on saute cet article et on passe au suivant.
                        continue; 
                    }
                }
                // --- FIN DE LA LOGIQUE DE FILTRAGE ---

                const pubDate = item.isoDate ? new Date(item.isoDate) : new Date();
                if (pubDate >= twentyFourHoursAgo && item.link) {
                    articlesToInsert.push({
                        resume: createSummary(item.title || item.contentSnippet),
                        source: feed.name,
                        url: item.link,
                        heure: pubDate.toISOString()
                    });
                }
            }
        } catch (error) {
            console.error(`❌ Erreur (gérée) pour ${feed.name}:`, error.message);
        }
    }
    
    if (articlesToInsert.length > 0) {
        const { error } = await supabase.from('actu').insert(articlesToInsert);
        if (error) { console.error('Erreur insertion Supabase:', error); return res.status(500).json({ success: false, error: error.message }); }
    }

    console.log(`✅ Parsing terminé. ${articlesToInsert.length} articles potentiellement nouveaux.`);
    res.status(200).json({ success: true, new_articles_found: articlesToInsert.length });
}