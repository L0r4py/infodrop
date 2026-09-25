// Fichier : /api/config.js
// API publique limitée aux valeurs nécessaires au client.

export default async function handler(req, res) {
    // Vérifier la méthode HTTP
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const config = {
            supabaseUrl: process.env.SUPABASE_URL,
            supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            adminEmails: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map((email) => email.trim()).filter(Boolean) : [],
            stripeLink: process.env.STRIPE_LINK || '',
            regionalSchemaEnabled: process.env.REGIONAL_SCHEMA_ENABLED === 'true'
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
