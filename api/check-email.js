// Fichier: /api/check-email.js (Version corrigée)
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Format d\'email invalide.' });
    }

    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        
        // CORRECTION : On utilise listUsers, qui est la bonne méthode
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ email: email.toLowerCase() });

        if (error) {
            console.error('[check-email] Erreur API Supabase:', error);
            return res.status(500).json({ error: 'Erreur serveur lors de la vérification.', details: error.message });
        }

        // On regarde si la liste contient un utilisateur
        const userExists = users && users.length > 0;
        
        console.log(`[check-email] Vérification pour ${email}: ${userExists ? 'trouvé' : 'non trouvé'}.`);
        return res.status(200).json({ exists: userExists });

    } catch (error) {
        console.error('[check-email] Erreur dans le bloc try/catch:', error);
        return res.status(500).json({ error: 'Erreur serveur inattendue.', details: error.message });
    }
}