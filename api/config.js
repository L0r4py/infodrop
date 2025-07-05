// Fichier : /api/config.js
// API pour fournir la configuration Supabase de manière sécurisée

export default async function handler(req, res) {
    // Vérifier la méthode HTTP
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        // Récupérer les variables d'environnement (utilise tes variables existantes)
        const config = {
            supabaseUrl: process.env.SUPABASE_URL,
            supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        };

        // Vérifier que les variables existent
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
            return res.status(500).json({ error: 'Configuration manquante' });
        }

        // Ajouter des headers de sécurité
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        
        // Retourner la configuration
        res.status(200).json(config);

    } catch (error) {
        console.error('Erreur config API:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}