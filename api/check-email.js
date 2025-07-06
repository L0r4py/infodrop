// Fichier: /api/check-email.js
// Rôle: Vérifie si un email existe déjà dans la base de données d'authentification.

import { createClient } from '@supabase/supabase-js';

// On crée un client Supabase qui a les droits "admin" pour pouvoir
// consulter la liste des utilisateurs de manière sécurisée.
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // La clé secrète qui donne les droits !
);

export default async function handler(req, res) {
    // 1. On accepte uniquement les requêtes de type POST (bonne pratique de sécurité)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { email } = req.body;

    // 2. On vérifie que l'email est bien présent et ressemble à un email
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Format d\'email invalide' });
    }

    try {
        // 3. On demande à Supabase de chercher UN SEUL utilisateur par son email.
        // C'est beaucoup plus rapide que de charger toute la liste des utilisateurs.
        const { data: user, error } = await supabase.auth.admin.getUserByEmail(email.toLowerCase());
        
        // Si Supabase renvoie une erreur "User not found", ce n'est pas une vraie erreur pour nous.
        // Cela signifie simplement que l'utilisateur n'existe pas.
        if (error && error.status === 404) {
             // L'utilisateur n'existe pas, c'est ce qu'on voulait savoir.
            return res.status(200).json({ exists: false });
        }
        
        // S'il y a une autre sorte d'erreur, c'est un vrai problème.
        if (error) {
            console.error('Erreur Supabase lors de la vérification de l\'email:', error);
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        // 4. Si on arrive ici sans erreur, ça veut dire que l'utilisateur a été trouvé.
        res.status(200).json({ exists: true });

    } catch (error) {
        console.error('Erreur inattendue dans check-email:', error);
        res.status(500).json({ error: 'Erreur serveur inattendue' });
    }
}