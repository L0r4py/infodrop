// Fichier : /api/parse-rss.js
// Version finale avec la liste des sources nettoyée et le code final

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

// La liste des flux RSS nettoyée et fonctionnelle
const RSS_FEEDS = [
    { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss' },
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml' },
    { name: 'Libération', url: 'https://www.liberation.fr/rss/latest/' },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml' },
    { name: '20 Minutes', url: 'https://www.20minutes.fr/rss/actu-france.xml' },
    { name: 'Ouest France', url: 'https://www.ouest-france.fr/rss-en-continu.xml' },
    { name: 'Courrier International', url: 'https://www.courrierinternational.com/feed' },
    { name: 'France Culture', url: 'https://www.radiofrance.fr/franceculture/podcasts' },
    { name: 'Sciences et Avenir', url: 'https://www.sciencesetavenir.fr/rss.xml' },
    { name: 'Konbini', url: 'https://www.konbini.com/fr/feed/' },
    { name: 'Numerama', url: 'https://www.numerama.com/feed/' },
    { name: "L'Obs", url: 'https://www.nouvelobs.com/rss.xml' },
    { name: 'France Inter', url: 'https://www.radiofrance.fr/franceinter/rss' },
    { name: 'La Tribune', url: 'https://www.latribune.fr/rss/rss_la_une.xml' },
    { name: 'Reporterre', url: 'https://reporterre.net/spip.php?page=backend' },
    { name: 'Réunion 1ère', url: 'https://la1ere.francetvinfo.fr/reunion/rss' },
    { name: 'Mayotte Hebdo', url: 'https://mayottehebdo.com/feed/' },
    { name: 'TNTV', url: 'https://www.tntv.pf/feed/' },
    { name: 'NC La 1ère', url: 'https://la1ere.francetvinfo.fr/nouvelle-caledonie/rss' },
    { name: 'L\'Info Kwezi', url: 'https://www.linfokwezi.fr/feed/' }
];

function createSummary(text) {
    if (!text) return '';
    // Version complète pour gérer tous les cas de caractères spéciaux
    const replacements = { '’': "'", '–': '-', '…': '...', '"': '"', '&': '&', '<': '<', '>': '>' };
    
    let cleanText = text.replace(/(&#?[a-z0-9]+;)/gi, (match) => replacements[match] || '');
    cleanText = cleanText.replace(/<[^>]*>/g, ' ').replace(/\s\s+/g, ' ').trim();
    
    if (cleanText.length > 180) {
        cleanText = cleanText.substring(0, 177) + '...';
    }
    return cleanText;
}

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) { return res.status(401).json({ error: 'Unauthorized' }); }
    
    console.log('🚀 Démarrage du parsing RSS INFODROP (v7 - Feeds nettoyés)');
    let articlesToInsert = [];
    // On ne prend que les actus des dernières 24h pour ne pas surcharger
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    for (const feed of RSS_FEEDS) {
        try {
            const feedData = await parser.parseURL(feed.url);
            for (const item of feedData.items) {
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
            console.error(`❌ Erreur pour ${feed.name}:`, error.message);
        }
    }
    
    if (articlesToInsert.length > 0) {
        const { error } = await supabase.from('actu').insert(articlesToInsert);
        if (error) {
            console.error('Erreur insertion Supabase:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    console.log(`✅ Parsing terminé. ${articlesToInsert.length} articles potentiellement nouveaux.`);
    res.status(200).json({ success: true, new_articles_found: articlesToInsert.length });
}