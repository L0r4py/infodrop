import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        return res.status(200).end();
    }

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
        let response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'Referer': 'https://www.google.com/'
            },
            signal: AbortSignal.timeout(10000)
        });

        if (response.status === 403 || response.status === 401) {
            console.log(`Direct fetch blocked (${response.status}) for ${url}. Retrying with proxy...`);
            const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url);
            response = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
        }

        if (!response.ok) {
            throw new Error(`Erreur lors du téléchargement de l'article (Code: ${response.status})`);
        }

        const html = await response.text();

        const { document } = parseHTML(html);

        // Pre-process: Remove common audio/ad blocks to prevent Readability from picking them up
        const selectorsToRemove = [
            '.audio-player', '.c-ad', '.ad-container', '.pub',
            'aside', '.outbrain', '.taboola', '[data-outbrain]',
            '.share-buttons', '.social-share', '.newsletter-form',
            'nav', 'footer', '.menu', '.banner', '.cookie-banner',
            '#skip-link', '.skip-link', '.sr-only', '.visually-hidden'
        ];
        selectorsToRemove.forEach(sel => {
            const els = document.querySelectorAll(sel);
            els.forEach(el => el.remove());
        });

        // Clean text nodes specifically for intrusive words often found near titles
        const allElements = document.querySelectorAll('div, span, button, a, p, em, strong, li');

        const exactOrStartPhrases = [
            'écouter', 'ecouter', 'publicité', 'min de lecture',
            'aller au contenu principal', 'aller au menu', 'partager sur',
            'je m\'abonne', "s'abonner", 'déjà abonné', 'déjà abonnée',
            'à lire aussi', 'a lire aussi', 'à voir aussi', 'a voir aussi',
            'sur le même sujet', 'lire aussi'
        ];

        const includePhrases = [
            'cet article est réservé',
            'article réservé aux abonnés',
            'vous souhaitez lire la suite',
            'la suite est réservée',
            'abonnez-vous sans engagement',
            'abonnez-vous pour',
            'offre numérique',
            'pour continuer à lire',
            'accès illimité'
        ];

        allElements.forEach(el => {
            const txt = el.textContent ? el.textContent.trim().toLowerCase() : '';

            const matchExact = exactOrStartPhrases.some(phrase => txt === phrase || txt.startsWith(phrase));
            const matchInclude = includePhrases.some(phrase => txt.includes(phrase));

            if (matchExact || matchInclude) {
                if (el.textContent.length < 250) { // Increased length to clip full subscription paragraphs
                    // FIX: Empty the content rather than removing the node completely.
                    // Removing nodes from Linkedom while traversing breaks Readability's parsing loop on some sites (like Reporterre)
                    el.innerHTML = '';
                }
            }
        });

        // Remove tracking pixels, empty images, or UI icons
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
            const width = img.getAttribute('width');
            const height = img.getAttribute('height');

            if (!src) {
                img.remove();
            } else if (src.startsWith('data:image/') && src.length < 2000) {
                img.remove(); // Small base64 UI images
            } else if (width === '1' || height === '1') {
                img.remove(); // Tracking pixels
            } else if (src.includes('.svg') && !img.hasAttribute('width')) {
                img.remove(); // Unsized SVG icons
            }
        });

        const reader = new Readability(document, {
            keepClasses: false
        });
        const article = reader.parse();

        if (!article || !article.content) {
            return res.status(400).json({ error: 'Impossible d\'extraire le contenu de cet article.' });
        }

        // Detect WAF soft-blocks (Akamai, Cloudflare) that return 200 OK but serve an error page
        const textContent = article.textContent || '';
        const titleContent = article.title || '';
        if (
            (textContent.includes('Désolé') && textContent.includes('Une erreur est survenue !')) ||
            titleContent.includes('Just a moment...') ||
            textContent.includes('Attention Required! | Cloudflare') ||
            textContent.includes('Défense contre les robots')
        ) {
            throw new Error('Le fournisseur de l\'article a bloqué l\'extraction (Protection Anti-Bot).');
        }

        let cleanedContent = article.content;

        // Post-process string replacements for leftover artifacts
        cleanedContent = cleanedContent.replace(/\[\d+\/\d+\]/g, ''); // Fix [1/2] or [2/2] artifacts
        cleanedContent = cleanedContent.replace(/>\s*Écouter\s*</gi, '><'); // Ensure 'Ecouter' inside tags is nuked
        cleanedContent = cleanedContent.replace(/>\s*Ecouter\s*</gi, '><');

        // Improve typography: double line breaks for distinct paragraphs if there are <br><br>
        cleanedContent = cleanedContent.replace(/<br\s*\/?>\s*<br\s*\/?>/g, '</p><p>');

        return res.status(200).json({
            title: article.title,
            byline: article.byline,
            content: cleanedContent,
            textContent: article.textContent,
            length: article.length,
            excerpt: article.excerpt,
            siteName: article.siteName
        });

    } catch (error) {
        console.error('Extraction error:', error);
        return res.status(500).json({ error: error.message || 'Erreur interne lors de l\'extraction.' });
    }
}
