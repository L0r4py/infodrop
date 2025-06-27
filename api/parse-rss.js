// Fichier : /api/parse-rss.js

import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

// Le client Supabase est initialisé avec les variables d'environnement
// que nous configurerons sur Vercel. Il utilise la clé secrète.
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const parser = new Parser({
    timeout: 10000, // 10 secondes de timeout par flux
    headers: {
        'User-Agent': 'INFODROP RSS Parser/1.0' // Certains sites requièrent un User-Agent
    }
});

// La liste complète de tes flux RSS
const RSS_FEEDS = [
    { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss' },
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml' },
    { name: 'Libération', url: 'https://www.liberation.fr/rss/latest/' },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml' },
    { name: '20 Minutes', url: 'https://www.20minutes.fr/rss/actu-france.xml' },
    { name: 'Ouest France', url: 'https://www.ouest-france.fr/rss-en-continu.xml' },
    { name: 'Courrier International', url: 'https://www.courrierinternational.com/feed' },
    { name: 'France Culture', url: 'https://www.radiofrance.fr/franceculture/podcasts' },
    { name: 'Futura Sciences', url: 'https://www.futura-sciences.com/rss/actu.xml' },
    { name: 'Sciences et Avenir', url: 'https://www.sciencesetavenir.fr/rss.xml' },
    { name: 'Konbini', url: 'https://www.konbini.com/fr/feed/' },
    { name: 'Numerama', url: 'https://www.numerama.com/feed/' },
    { name: "L'Obs", url: 'https://www.nouvelobs.com/rss.xml' },
    { name: 'France Inter', url: 'https://www.radiofrance.fr/franceinter/rss' },
    { name: 'Les Échos', url: 'https://www.lesechos.fr/rss/rss_actualite.xml' },
    { name: 'La Tribune', url: 'https://www.latribune.fr/rss/rss_la_une.xml' },
    { name: 'Boursorama', url: 'https://www.boursorama.com/actualites/rss.xml' },
    { name: 'Reporterre', url: 'https://reporterre.net/spip.php?page=backend' },
    { name: 'Blast', url: 'https://www.blast-info.fr/rss' },
    { name: 'Arrêt sur Images', url: 'https://www.arretsurimages.net/rss' },
    { name: 'Guadeloupe 1ère', url: 'https://la1ere.francetvinfo.fr/guadeloupe/rss' },
    { name: 'Martinique 1ère', url: 'https://la1ere.francetvinfo.fr/martinique/rss' },
    { name: 'Guyane 1ère', url: 'https://la1ere.francetvinfo.fr/guyane/rss' },
    { name: 'Réunion 1ère', url: 'https://la1ere.francetvinfo.fr/reunion/rss' },
    { name: 'Mayotte Hebdo', url: 'https://mayottehebdo.com/feed/' },
    { name: 'TNTV', url: 'https://www.tntv.pf/feed/' },
    { name: 'NC La 1ère', url: 'https://la1ere.francetvinfo.fr/nouvelle-caledonie/rss' }
];

// Fonction pour créer un résumé court et propre
function createSummary(text) {
    if (!text) return '';
    // Nettoyer les balises HTML et les entités HTML
    let cleanText = text.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ');
    cleanText = cleanText.replace(/\s\s+/g, ' ').trim(); // Remplacer les espaces multiples
    
    if (cleanText.length > 180) {
        cleanText = cleanText.substring(0, 177) + '...';
    }
    return cleanText;
}

// C'est la fonction principale qui sera appelée par Vercel
export default async function handler(req, res) {
    // Sécurité : on vérifie que la requête vient bien d'un cron sécurisé
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    console.log('🚀 Démarrage du parsing RSS INFODROP');
    let articlesToInsert = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // On parcourt tous les flux
    for (const feed of RSS_FEEDS) {
        try {
            const feedData = await parser.parseURL(feed.url);
            for (const item of feedData.items) {
                const pubDate = item.isoDate ? new Date(item.isoDate) : new Date();
                // On ne garde que les articles du jour
                if (pubDate >= today && item.link) {
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
        // On insère tous les nouveaux articles en une seule fois.
        // Le trigger dans la BDD s'occupera d'ignorer les doublons.
        const { error } = await supabase.from('actu').insert(articlesToInsert);
        
        if (error) {
            console.error('Erreur lors de l\'insertion Supabase:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    console.log(`✅ Parsing terminé. ${articlesToInsert.length} articles potentiellement nouveaux.`);
    res.status(200).json({ success: true, new_articles_found: articlesToInsert.length });
}