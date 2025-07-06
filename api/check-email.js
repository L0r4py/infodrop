// Fichier: /api/check-email.js (Version de débogage)
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    console.log('[check-email] API appelée.');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // --- Étape 1: Vérifier le corps de la requête ---
    if (!req.body) {
        console.error('[check-email] Erreur: req.body est vide ou non parsé.');
        return res.status(400).json({ error: 'Corps de la requête manquant.' });
    }
    console.log('[check-email] req.body reçu:', req.body);
    
    const { email } = req.body;

    // --- Étape 2: Valider l'email ---
    if (!email || !email.includes('@')) {
        console.error('[check-email] Erreur: Email invalide ou manquant.', { email });
        return res.status(400).json({ error: 'Format d\'email invalide.' });
    }
    console.log('[check-email] Email à vérifier:', email);

    // --- Étape 3: Initialiser Supabase ---
    let supabase;
    try {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        console.log('[check-email] Client Supabase initialisé avec succès.');
    } catch (e) {
        console.error('[check-email] Erreur fatale lors de l\'initialisation de Supabase:', e.message);
        return res.status(500).json({ error: 'Erreur configuration serveur.' });
    }

    // --- Étape 4: Appeler la méthode Supabase ---
    try {
        console.log('[check-email] Appel de supabase.auth.admin.getUserByEmail...');
        const { data: user, error } = await supabase.auth.admin.getUserByEmail(email.toLowerCase());
        console.log('[check-email] Réponse de Supabase reçue.');

        if (error && error.status === 404) {
            console.log('[check-email] Utilisateur non trouvé. Réponse: { exists: false }');
            return res.status(200).json({ exists: false });
        }
        
        if (error) {
            console.error('[check-email] Erreur API Supabase:', error);
            return res.status(500).json({ error: 'Erreur serveur lors de la vérification.', details: error.message });
        }

        console.log('[check-email] Utilisateur trouvé. Réponse: { exists: true }');
        return res.status(200).json({ exists: true });

    } catch (error) {
        console.error('[check-email] Erreur dans le bloc try/catch principal:', error);
        return res.status(500).json({ error: 'Erreur serveur inattendue.', details: error.message });
    }
}