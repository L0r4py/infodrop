// Fichier : /api/parse-rss.js
// Version 23.3 - Ajout decodeHtmlEntities pour titres Konbini mal encodés + nouvelles sources

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
    { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', orientation: 'centre', tags: ['national'] },
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', orientation: 'centre-gauche', tags: ['national'] },
    { name: 'Libération', url: 'https://www.liberation.fr/arc/outboundfeeds/rss-all/?outputType=xml', orientation: 'gauche', tags: ['national'] },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml', orientation: 'droite', tags: ['national'] },
    { name: 'Le Parisien', url: 'https://feeds.leparisien.fr/leparisien/rss', orientation: 'centre-droit', tags: ['national'] },
    { name: 'Ouest France', url: 'https://www.ouest-france.fr/rss-en-continu.xml', orientation: 'centre', tags: ['regional'] },
    { name: 'Courrier International', url: 'https://www.courrierinternational.com/feed/all/rss.xml', orientation: 'centre-gauche', tags: ['traduction'] },
    { name: 'France Inter', url: 'https://www.radiofrance.fr/franceinter/rss', orientation: 'centre-gauche', tags: ['national'] },
    { name: "France24", url: 'https://www.france24.com/fr/france/rss', orientation: 'centre-gauche', tags: ['national'] },
    { name: "L'Obs", url: 'https://www.nouvelobs.com/rss.xml', orientation: 'centre-gauche', tags: ['national'] },

    // --- RÉGIONALES ---
    { name: "La Depeche", url: 'https://www.ladepeche.fr/rss.xml', orientation: 'centre-gauche', tags: ['regional'] },
    { name: "Sud Ouest", url: 'https://www.sudouest.fr/rss.xml', orientation: 'centre-gauche', tags: ['regional'] },
    { name: "La Republique des Pyrenees", url: 'https://www.larepubliquedespyrenees.fr/rss.xml', orientation: 'centre-gauche', tags: ['regional'] },

    // --- SOURCES OFFICIELLES & PARLEMENTAIRES ---
    { name: 'Sénat (Textes)', url: 'https://www.senat.fr/rss/textes.xml', orientation: 'neutre', tags: ['officiel'] },
    { name: 'Sénat (Presse)', url: 'https://www.senat.fr/rss/presse.xml', orientation: 'neutre', tags: ['officiel'] },
    { name: 'Assemblée Nat. (Docs)', url: 'https://www2.assemblee-nationale.fr/feeds/detail/documents-parlementaires', orientation: 'neutre', tags: ['officiel'] },
    { name: 'Assemblée Nat. (CRs)', url: 'https://www2.assemblee-nationale.fr/feeds/detail/crs', orientation: 'neutre', tags: ['officiel'] },

    // --- CULTURE / SCIENCES / SOCIÉTÉ ---
    { name: 'France Culture', url: 'https://www.radiofrance.fr/franceculture/rss', orientation: 'centre-gauche', tags: ['culture'] },
    { name: 'Futura Sciences', url: 'https://www.futura-sciences.com/rss/actualites.xml', orientation: 'centre', tags: ['sciences'] },
    { name: 'Sciences et Avenir', url: 'https://www.sciencesetavenir.fr/rss.xml', orientation: 'centre', tags: ['sciences'] },
    { name: 'Konbini', url: 'https://www.konbini.com/fr/feed/', orientation: 'centre', tags: ['pop', 'tendance'] },
    { name: 'Numerama', url: 'https://www.numerama.com/feed/', orientation: 'centre', tags: ['tech'] },
    { name: 'Zataz', url: 'https://www.zataz.com/feed/', orientation: 'neutre', tags: ['tech'] },
    { name: 'Reflets', url: 'https://reflets.info/feeds/public', orientation: 'gauche', tags: ['hacktivisme'] },

    // --- ECO & CRYPTO ---
    { name: 'Journal du coin', url: 'https://journalducoin.com/feed/', orientation: 'neutre', tags: ['crypto'] },
    { name: 'Cryptoast', url: 'https://cryptoast.fr/feed/', orientation: 'neutre', tags: ['crypto'] },

    // --- INDÉPENDANTS ---
    { name: 'Reporterre', url: 'https://reporterre.net/spip.php?page=backend', orientation: 'gauche', tags: ['écologie'] },
    { name: 'Blast', url: 'https://api.blast-info.fr/rss.xml', orientation: 'gauche', tags: ['independant'] },
    { name: 'Arrêt sur Images', url: 'https://api.arretsurimages.net/api/public/rss/all-content', orientation: 'centre-gauche', tags: ['investigation'] },
    { name: 'Apar.tv', url: 'https://www.apar.tv/latest/rss/', orientation: 'centre-gauche', tags: ['pop'] },
    { name: 'Le Média en 4-4-2', url: 'https://lemediaen442.fr/feed/', orientation: 'centre-gauche', tags: ['independant'] },

    // --- PRESSE D’OPINION & IDÉOLOGIQUE ---
    { name: "L'Humanité", url: 'https://www.humanite.fr/sections/politique/feed', orientation: 'gauche', tags: ['politique'] },
    { name: "L'Humanité", url: 'https://www.humanite.fr/sections/social-et-economie/feed', orientation: 'gauche', tags: ['économie'] },
    { name: "L'Humanité", url: 'https://www.humanite.fr/mot-cle/extreme-droite/feed', orientation: 'gauche', tags: ['opinion'] },
    { name: 'Politis', url: 'https://www.politis.fr/flux-rss-apps/', orientation: 'gauche', tags: ['opinion'] },
    { name: 'Regards', url: 'https://regards.fr/category/l-actu/feed/', orientation: 'gauche', tags: ['opinion'] },
    { name: 'La Croix', url: 'https://www.la-croix.com/feeds/rss/societe.xml', orientation: 'centre-droit', tags: ['national', 'société'] },
    { name: 'La Croix', url: 'https://www.la-croix.com/feeds/rss/politique.xml', orientation: 'centre-droit', tags: ['national', 'politique'] },
    { name: 'La Croix', url: 'https://www.la-croix.com/feeds/rss/culture.xml', orientation: 'centre-droit', tags: ['national', 'culture'] },
    { name: "L'Opinion", url: 'https://www.lopinion.fr/index.rss', orientation: 'droite', tags: ['opinion'] },
    { name: 'Valeurs Actuelles', url: 'https://www.valeursactuelles.com/feed?post_type=post', orientation: 'extrême-droite', tags: ['opinion'] },
    { name: 'Causeur', url: 'https://www.causeur.fr/feed', orientation: 'extrême-droite', tags: ['opinion'] },
    { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', orientation: 'centre-droit', tags: ['tv'] },
    { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/people/', orientation: 'centre-droit', tags: ['people'] },
    { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/crypto/', orientation: 'centre-droit', tags: ['crypto'] },
    { name: 'Révolution Permanente', url: 'https://www.revolutionpermanente.fr/spip.php?page=backend_portada', orientation: 'extrême-gauche', tags: ['opinion'] },
    { name: 'Cnews', url: 'https://www.cnews.fr/rss.xml', orientation: 'extrême-droite', tags: ['opinion'] },
    { name: 'FranceSoir', url: 'https://www.francesoir.fr/rss.xml', orientation: 'extrême-droite', tags: ['opinion'] },

    // --- PRESSE ÉTRANGÈRE ---
    { name: 'RTBF', url: 'https://rss.rtbf.be/article/rss/highlight_rtbf_info.xml?source=internal', orientation: 'centre-gauche', tags: ['belgique'] },

    // --- OUTRE-MER ---
    { name: 'Mayotte Hebdo', url: 'https://mayottehebdo.com/feed/', orientation: 'centre', tags: ['outre-mer', 'local'] },
    { name: "L'Info Kwezi", url: 'https://www.linfokwezi.fr/feed/', orientation: 'centre', tags: ['outre-mer', 'local'] },

    // === NOUVELLES SOURCES AJOUTÉES EN JUILLET 2025 ===
    // --- MULTIPERSPECTIVES / OPINION / GÉOPOLITIQUE / ALTERNATIF ---
    { name: 'Réseau International', url: 'https://reseauinternational.net/feed/', orientation: 'extrême-droite', tags: ['alternatif'] },
    { name: 'Le Saker Francophone', url: 'https://lesakerfrancophone.fr/feed/', orientation: 'extrême-droite', tags: ['alternatif'] },
    { name: 'Geopolintel', url: 'https://geopolintel.fr/spip.php?page=backend', orientation: 'extrême-droite', tags: ['alternatif'] },
    { name: 'Le Grand Continent', url: 'https://legrandcontinent.eu/fr/feed/', orientation: 'centre-gauche', tags: ['europe'] },
    { name: 'La Réclame', url: 'https://lareclame.fr/feed', orientation: 'centre', tags: ['communication'] },
    { name: 'Mind Media', url: 'https://www.mindmedia.fr/feed/', orientation: 'centre-droit', tags: ['communication'] },
    { name: 'The Conversation France', url: 'https://theconversation.com/fr/articles.atom', orientation: 'centre', tags: ['science'] },
    { name: 'Nexus', url: 'https://nexus.fr/feed/', orientation: 'extrême-droite', tags: ['alternatif'] },
    { name: 'CNRS Le Journal', url: 'https://lejournal.cnrs.fr/rss', orientation: 'neutre', tags: ['science'] }
];

// --- DÉCODEUR D'ENTITÉS HTML POUR LES SOURCES MAL ENCODÉES ---
function decodeHtmlEntities(str) {
    if (!str) return '';
    return str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&eacute;/g, 'é')
              .replace(/&egrave;/g, 'è')
              .replace(/&ecirc;/g, 'ê')
              .replace(/&rsquo;/g, '’')
              .replace(/&hellip;/g, '…');
}

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
    // Ajout : décode les entités HTML pour tous les titres (optionnel, sinon juste Konbini dans la boucle)
    text = decodeHtmlEntities(text);

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

    console.log('🚀 Démarrage du parsing RSS INFODROP (v23.3 - Ajout decodeHtmlEntities titres Konbini)');

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
                    // Correction affichage pour Konbini uniquement (titre mal encodé)
                    let titleToUse = item.title;
                    if (feed.name === 'Konbini') {
                        titleToUse = decodeHtmlEntities(item.title);
                    }
                    articlesToInsert.push({
                        resume: createSummary(titleToUse || item.contentSnippet),
                        source: feed.name,
                        url: item.link,
                        heure: pubDate.toISOString(),
                        orientation: feed.orientation,
                        tags: feed.tags || null
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
