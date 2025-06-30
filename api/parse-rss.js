// Fichier : /api/parse-rss.js
// Version 22 - Correction finale de la syntaxe

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

// Ta liste de flux RSS complète et organisée
const RSS_FEEDS = [
    // --- GENERALISTES ---
    { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', orientation: 'centre' },
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', orientation: 'centre-gauche' },
    { name: 'Libération', url: 'https://www.liberation.fr/arc/outboundfeeds/rss-all/?outputType=xml', orientation: 'gauche' },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml', orientation: 'centre-droit' },
    { name: 'Le Parisien', url: 'https://feeds.leparisien.fr/leparisien/rss', orientation: 'centre' },
    { name: 'Ouest France', url: 'https://www.ouest-france.fr/rss-en-continu.xml', orientation: 'centre' },
    { name: 'Courrier International', url: 'https://www.courrierinternational.com/feed/all/rss.xml', orientation: 'centre' },
    { name: 'France Inter', url: 'https://www.radiofrance.fr/franceinter/rss', orientation: 'centre-gauche' },

    // --- SOURCES OFFICIELLES & PARLEMENTAIRES ---
    { name: 'Sénat (Textes)', url: 'https://www.senat.fr/rss/textes.xml', orientation: 'neutre' },
    { name: 'Sénat (Presse)', url: 'https://www.senat.fr/rss/presse.xml', orientation: 'neutre' },
    { name: 'Assemblée Nat. (Docs)', url: 'https://www2.assemblee-nationale.fr/feeds/detail/documents-parlementaires', orientation: 'neutre' },
    { name: 'Assemblée Nat. (CRs)', url: 'https://www2.assemblee-nationale.fr/feeds/detail/crs', orientation: 'neutre' },
    { name: 'Info.gouv', url: 'https://www.info.gouv.fr/rss/actualites.xml', orientation: 'neutre' },

    // --- CULTURE / SCIENCES / SOCIÉTÉ ---
    { name: 'France Culture', url: 'https://www.radiofrance.fr/franceculture/rss', orientation: 'centre-gauche' },
    { name: 'Futura Sciences', url: 'https://www.futura-sciences.com/rss/actualites.xml', orientation: 'centre' },
    { name: 'Sciences et Avenir', url: 'https://www.sciencesetavenir.fr/rss.xml', orientation: 'centre' },
    { name: 'Konbini', url: 'https://www.konbini.com/fr/feed/', orientation: 'centre' },
    { name: 'Numerama', url: 'https://www.numerama.com/feed/', orientation: 'centre' },
    { name: "L'Obs", url: 'https://www.nouvelobs.com/rss.xml', orientation: 'centre-gauche' },

    // --- INDÉPENDANTS ---
    { name: 'Reporterre', url: 'https://reporterre.net/spip.php?page=backend', orientation: 'gauche' },
    { name: 'Blast', url: 'https://api.blast-info.fr/rss.xml', orientation: 'gauche' },
    { name: 'Arrêt sur Images', url: 'https://api.arretsurimages.net/api/public/rss/all-content', orientation: 'centre-gauche' },

    // --- PRESSE D’OPINION & IDÉOLOGIQUE ---
    { name: "L'Humanité - Politique", url: 'https://www.humanite.fr/sections/politique/feed', orientation: 'gauche' },
    { name: "L'Humanité - Social et Économie", url: 'https://www.humanite.fr/sections/social-et-economie/feed', orientation: 'gauche' },
    { name: "L'Humanité - Extrême droite", url: 'https://www.humanite.fr/mot-cle/extreme-droite/feed', orientation: 'gauche' },
    { name: 'Politis', url: 'https://www.politis.fr/flux-rss-apps/', orientation: 'gauche' },
    { name: 'Regards', url: 'https://regards.fr/category/l-actu/feed/', orientation: 'gauche' },
    { name: 'La Croix - Société', url: 'https://www.la-croix.com/feeds/rss/societe.xml', orientation: 'centre-droit' },
    { name: 'La Croix - Politique', url: 'https://www.la-croix.com/feeds/rss/politique.xml', orientation: 'centre-droit' },
    { name: 'La Croix - Culture', url: 'https://www.la-croix.com/feeds/rss/culture.xml', orientation: 'centre-droit' },
    { name: "L'Opinion", url: 'https://www.lopinion.fr/index.rss', orientation: 'droite' },
    { name: 'Valeurs Actuelles', url: 'https://www.valeursactuelles.com/feed?post_type=post', orientation: 'extrême-droite' },
    { name: 'Causeur', url: 'https://www.causeur.fr/feed', orientation: 'extrême-droite' },
    { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', orientation: 'centre-droit' },
    { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/people/', orientation: 'centre-droit' },
    { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/crypto/', orientation: 'centre-droit' },

    // --- OUTRE-MER ---
    { name: 'Mayotte Hebdo', url: 'https://mayottehebdo.com/feed/', orientation: 'centre' },
    { name: "L'Info Kwezi", url: 'https://www.linfokwezi.fr/feed/', orientation: 'centre' }
];

// RÈGLES DE FILTRAGE PAR MOTS-CLÉS
const FILTER_RULES = {
    'Le Parisien': ['météo', 'horoscope']
};

// RÈGLES DE FILTRAGE GLOBALES
const GLOBAL_FILTER_KEYWORDS = [
    'horoscope', 'astrologie', 'loterie', 'programme tv', 'recette', 'mots croisés', 'sudoku'
];

function createSummary(text) {
    if (!text) return '';
    const replacements = { '’': "'", '–': '-', '…': '...', '"': '"', '&': '&', '<': '<', '>': '>' };
    let cleanText = text.replace(/(&#?[a-z0-9]+;)/gi, (match) => replacements[match] || '');
    cleanText = cleanText.replace(/<[^>]*>/g, ' ').replace(/\s\s+/g, ' ').trim();
    if (cleanText.length > 180) {
        cleanText = cleanText.substring(0, 177) + '...';
    }
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

    console.log('🚀 Démarrage du parsing RSS INFODROP (v22 - Syntax Fix)');

    let articlesToInsert = [];
    let filteredCount = 0;
    const now = new Date();

    for (const feed of RSS_FEEDS) {
        try {
            const feedData = await parser.parseURL(feed.url);
            for (const item of feedData.items) {
                if (shouldFilterArticle(item.title, feed.name)) {
                    filteredCount++;
                    continue;
                }

                let pubDate = item.isoDate ? new Date(item.isoDate) : new Date(now);

                if (pubDate > now) {
                    pubDate = new Date(now);
                }

                const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

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
