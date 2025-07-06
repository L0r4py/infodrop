// Fichier: /api/validate-invite.js
// Rôle: Valide un code d'invitation, le consomme, et génère un nouveau code pour le filleul.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    // 1. Accepter uniquement les requêtes POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { code, email } = req.body;

    // 2. Vérifier que les informations nécessaires sont présentes
    if (!code || !email) {
        return res.status(400).json({ error: 'Un code et un email sont requis' });
    }

    try {
        // --- Étape A : Vérifier le code d'invitation ---
        const { data: codeData, error: fetchError } = await supabase
            .from('invitation_codes')
            .select('*')
            .eq('code', code)
            .single(); // On s'attend à trouver un seul code

        // Si le code n'existe pas ou s'il y a une erreur
        if (fetchError || !codeData) {
            return res.status(400).json({ error: 'Ce code d\'invitation est invalide.' });
        }

        // Si le code a déjà été utilisé
        if (codeData.is_used) {
            return res.status(400).json({ error: 'Ce code d\'invitation a déjà été utilisé.' });
        }

        // --- Étape B : Marquer le code comme "utilisé" ---
        const { error: updateError } = await supabase
            .from('invitation_codes')
            .update({
                is_used: true,
                used_by_email: email,
                used_at: new Date().toISOString()
            })
            .eq('id', codeData.id); // On met à jour par l'ID, c'est plus sûr

        if (updateError) {
            console.error('Erreur lors de la mise à jour du code:', updateError);
            return res.status(500).json({ error: 'Erreur serveur lors de la validation.' });
        }

        // --- Étape C : Créer un nouveau code pour le nouvel utilisateur ---
        // On utilise la fonction SQL `generate_invitation_code()` que tu as créée !
        const { data: newCodeData, error: newCodeError } = await supabase
            .rpc('generate_invitation_code');

        if (newCodeError || !newCodeData) {
             console.error('Erreur RPC generate_invitation_code:', newCodeError);
             // On ne bloque pas l'inscription pour ça, mais on le signale.
             // L'utilisateur pourra toujours s'inscrire, mais n'aura pas de code à partager.
        } else {
            // On enregistre le nouveau code généré en l'associant au nouvel utilisateur
            await supabase.from('invitation_codes').insert({
                code: newCodeData,
                owner_email: email,
                parent_code_id: codeData.id, // On crée le lien de parenté !
                generation: codeData.generation + 1
            });
        }
        
        // --- Étape D : Renvoyer une réponse de succès ---
        // Tout s'est bien passé, le front-end peut maintenant demander le magic link.
        res.status(200).json({ success: true, message: 'Code validé avec succès.' });

    } catch (error) {
        console.error('Erreur inattendue dans validate-invite:', error);
        res.status(500).json({ error: 'Erreur serveur inattendue.' });
    }
}