// Fichier : /api/parse-rss.js
// Version 15 - La Grande Mise à Jour avec orientation politique et filtres avancés

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

// Liste enrichie des flux RSS classés par orientation politique
const RSS_FEEDS = [
    // === EXTRÊME GAUCHE ===
    { name: 'L\'Humanité', url: 'https://www.humanite.fr/rss/actu.rss', orientation: 'extreme-gauche' },
    { name: 'Révolution Permanente', url: 'https://www.revolutionpermanente.fr/spip.php?page=backend', orientation: 'extreme-gauche' },

    // === GAUCHE ===
    { name: 'Libération', url: 'https://www.liberation.fr/arc/outboundfeeds/rss-all/?outputType=xml', orientation: 'gauche' },
    { name: 'Reporterre', url: 'https://reporterre.net/spip.php?page=backend', orientation: 'gauche' },
    { name: 'Politis', url: 'https://www.politis.fr/feed/', orientation: 'gauche' },
    { name: 'Alternatives Économiques', url: 'https://www.alternatives-economiques.fr/rss.xml', orientation: 'gauche' },
    { name: 'Mediapart', url: 'https://www.mediapart.fr/articles/feed', orientation: 'gauche' },
    { name: 'Le Média', url: 'https://www.lemediatv.fr/feed', orientation: 'gauche' },
    { name: 'Blast', url: 'https://www.blast-info.fr/rss', orientation: 'gauche' },

    // === CENTRE GAUCHE ===
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', orientation: 'centre-gauche' },
    { name: 'France Inter', url: 'https://www.radiofrance.fr/franceinter/rss', orientation: 'centre-gauche' },
    { name: 'France Culture', url: 'https://www.radiofrance.fr/franceculture/rss', orientation: 'centre-gauche' },
    { name: 'Télérama', url: 'https://www.telerama.fr/rss/une.xml', orientation: 'centre-gauche' },
    { name: "L'Obs", url: 'https://www.nouvelobs.com/rss.xml', orientation: 'centre-gauche' },
    { name: 'Arrêt sur Images', url: 'https://api.arretsurimages.net/api/public/rss/all-content', orientation: 'centre-gauche' },
    { name: 'CheckNews (Libération)', url: 'https://www.liberation.fr/arc/outboundfeeds/collection/checknews/?outputType=xml', orientation: 'centre-gauche' },
    { name: 'Les Décodeurs (Le Monde)', url: 'https://www.lemonde.fr/les-decodeurs/rss_full.xml', orientation: 'centre-gauche' },

    // === CENTRE ===
    { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', orientation: 'centre' },
    { name: 'Le Parisien', url: 'https://feeds.leparisien.fr/leparisien/rss', orientation: 'centre' },
    { name: '20 Minutes', url: 'https://www.20minutes.fr/feeds/rss-une.xml', orientation: 'centre' },
    { name: 'Ouest France', url: 'https://www.ouest-france.fr/rss-en-continu.xml', orientation: 'centre' },
    { name: 'La Dépêche', url: 'https://www.ladepeche.fr/rss.xml', orientation: 'centre' },
    { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', orientation: 'centre' },
    { name: 'RFI', url: 'https://www.rfi.fr/fr/rss', orientation: 'centre' },
    { name: 'TV5 Monde', url: 'https://information.tv5monde.com/les-jt/rss', orientation: 'centre' },
    { name: 'Courrier International', url: 'https://www.courrierinternational.com/feed/all/rss.xml', orientation: 'centre' },
    { name: 'AFP Factuel', url: 'https://factuel.afp.com/rss.xml', orientation: 'centre' },
    { name: 'Off Investigation', url: 'https://off-investigation.fr/feed/', orientation: 'centre' },

    // === CENTRE DROIT ===
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml', orientation: 'centre-droit' },
    { name: 'Les Échos', url: 'https://syndication.lesechos.fr/rss/rss_une.xml', orientation: 'centre-droit' },
    { name: 'L\'Express', url: 'https://www.lexpress.fr/rss/alaune.xml', orientation: 'centre-droit' },
    { name: 'Le Point', url: 'https://www.lepoint.fr/rss.xml', orientation: 'centre-droit' },
    { name: 'La Tribune', url: 'https://www.latribune.fr/feed.xml', orientation: 'centre-droit' },
    { name: 'Challenges', url: 'https://www.challenges.fr/rss.xml', orientation: 'centre-droit' },
    { name: 'Capital', url: 'https://www.capital.fr/feed', orientation: 'centre-droit' },

    // === DROITE ===
    { name: 'Valeurs Actuelles', url: 'https://www.valeursactuelles.com/feed', orientation: 'droite' },
    { name: 'Causeur', url: 'https://www.causeur.fr/feed', orientation: 'droite' },
    { name: 'Le Figaro Magazine', url: 'https://www.lefigaro.fr/rss/figaro_magazine.xml', orientation: 'droite' },
    { name: 'Boulevard Voltaire', url: 'https://www.bvoltaire.fr/feed/', orientation: 'droite' },

    // === EXTRÊME DROITE ===
    { name: 'Présent', url: 'https://present.fr/feed/', orientation: 'extreme-droite' },
    { name: 'Riposte Laïque', url: 'https://ripostelaique.com/feed', orientation: 'extreme-droite' },

    // === PRESSE SPÉCIALISÉE ===
    { name: 'Futura Sciences', url: 'https://www.futura-sciences.com/rss/actualites.xml', orientation: 'centre' },
    { name: 'Sciences et Avenir', url: 'https://www.sciencesetavenir.fr/rss.xml', orientation: 'centre' },
    { name: 'Numerama', url: 'https://www.numerama.com/feed/', orientation: 'centre' },
    { name: '01Net', url: 'https://www.01net.com/rss/info/flux-rss/flux-toutes-les-actualites/', orientation: 'centre' },
    { name: 'Konbini', url: 'https://www.konbini.com/fr/feed/', orientation: 'centre' },

    // === PRESSE RÉGIONALE & DOM-TOM ===
    { name: 'Nice Matin', url: 'https://www.nicematin.com/rss', orientation: 'centre' },
    { name: 'Sud Ouest', url: 'https://www.sudouest.fr/essentiel/rss.xml', orientation: 'centre' },
    { name: 'La Voix du Nord', url: 'https://www.lavoixdunord.fr/rss', orientation: 'centre' },
    { name: 'Corse Matin', url: 'https://www.corsematin.com/rss', orientation: 'centre' },
    { name: 'France-Guyane', url: 'https://www.franceguyane.fr/rss.xml', orientation: 'centre' },
    { name: 'La Première (Réunion)', url: 'https://la1ere.francetvinfo.fr/reunion/rss', orientation: 'centre' },
    { name: 'Mayotte Hebdo', url: 'https://mayottehebdo.com/feed/', orientation: 'centre' },
    { name: 'L\'Info Kwezi', url: 'https://www.linfokwezi.fr/feed/', orientation: 'centre' },
    { name: 'Martinique 1ère', url: 'https://la1ere.francetvinfo.fr/martinique/rss', orientation: 'centre' },
    { name: 'Guadeloupe 1ère', url: 'https://la1ere.francetvinfo.fr/guadeloupe/rss', orientation: 'centre' },

    // === PRESSE INTERNATIONALE FRANCOPHONE ===
    { name: 'Le Soir (Belgique)', url: 'https://www.lesoir.be/rss/81853/cible_principale_gratuit', orientation: 'centre-gauche' },
    { name: 'Le Temps (Suisse)', url: 'https://www.letemps.ch/rss', orientation: 'centre-droit' },
    { name: 'La Presse (Canada)', url: 'https://www.lapresse.ca/rss/225.xml', orientation: 'centre' }
];

const FILTER_RULES = {
    'Le Parisien': ['météo', 'horoscope'],
    'Le Figaro': ['horoscope', 'jeux'],
    '20 Minutes': ['horoscope', 'météo'],
    'BFMTV': ['météo'],
};

const GLOBAL_FILTER_KEYWORDS = [ 'horoscope', 'astrologie', 'loterie', 'euromillions', 'programme tv', 'recette de cuisine', 'mots croisés', 'sudoku' ];

function createSummary(text) {
    if (!text) return '';
    const replacements = { '’': "'", '–': '-', '…': '...', '"': '"', '&': '&', '<': '<', '>': '>' };
    let cleanText = text.replace(/(&#?[a-z0-9]+;)/gi, (match) => replacements[match] || '');
    cleanText = cleanText.replace(/<[^>]*>/g, ' ').replace(/\s\s+/g, ' ').trim();
    if (cleanText.length > 180) { cleanText = cleanText.substring(0, 177) + '...'; }
    return cleanText;
}

function shouldFilterArticle(title, source) {
    const lowerTitle = (title || '').toLowerCase();
    if (GLOBAL_FILTER_KEYWORDS.some(keyword => lowerTitle.includes(keyword))) return true;
    const sourceFilters = FILTER_RULES[source];
    if (sourceFilters && sourceFilters.some(keyword => lowerTitle.includes(keyword))) return true;
    return false;
}

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) { 
        return res.status(401).json({ error: 'Unauthorized' }); 
    }
    
    console.log('🚀 Démarrage du parsing RSS INFODROP (v15 - Orientation Update)');
    let articlesToInsert = [];
    let filteredCount = 0;
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    for (const feed of RSS_FEEDS) {
        try {
            const feedData = await parser.parseURL(feed.url);
            for (const item of feedData.items) {
                if (shouldFilterArticle(item.title, feed.name)) {
                    filteredCount++;
                    continue;
                }

                const pubDate = item.isoDate ? new Date(item.isoDate) : new Date();
                if (pubDate >= twentyFourHoursAgo && item.link) {
                    articlesToInsert.push({
                        resume: createSummary(item.title || item.contentSnippet),
                        source: feed.name,
                        url: item.link,
                        heure: pubDate.toISOString(),
                        orientation: feed.orientation
                    });
                }
            }
        } catch (error) {
            console.error(`❌ Erreur (gérée) pour ${feed.name}:`, error.message);
        }
    }
    
    if (articlesToInsert.length > 0) {
        const { error } = await supabase.from('actu').insert(articlesToInsert);
        if (error) { 
            console.error('Erreur insertion Supabase:', error); 
            return res.status(500).json({ success: false, error: error.message }); 
        }
    }

    console.log(`✅ Parsing terminé. ${articlesToInsert.length} articles trouvés, ${filteredCount} filtrés.`);
    res.status(200).json({ 
        success: true, 
        new_articles_found: articlesToInsert.length,
        articles_filtered: filteredCount
    });
}