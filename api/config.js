// Fichier : /api/config.js
// API pour fournir TOUTES les configurations de manière sécurisée

export default async function handler(req, res) {
    // Vérifier la méthode HTTP
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        // Récupérer TOUTES les variables d'environnement
        const config = {
            supabaseUrl: process.env.SUPABASE_URL,
            supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            adminEmails: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['l0r4.py@gmail.com'],
            stripeLink: process.env.STRIPE_LINK || 'https://buy.stripe.com/7sYcN6fh6ez47u5ejh28801'
        };

        // Vérifier que les variables essentielles existent
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
            return res.status(500).json({ error: 'Configuration Supabase manquante' });
        }

        // Ajouter des headers de sécurité
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        
        // Retourner la configuration complète
        res.status(200).json(config);

    } catch (error) {
        console.error('Erreur config API:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}