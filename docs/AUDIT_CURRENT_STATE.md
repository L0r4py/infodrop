# Audit de l’état actuel

Audit en lecture seule effectué le 25 septembre 2026 avant développement.

## Résumé

Trois états du projet coexistaient :

1. le dépôt GitHub `L0r4py/infodrop`, resté sur une version statique gamifiée ;
2. la production `infodrop.live`, plus récente, construite avec Vite et Alpine puis déployée en ligne de commande ;
3. plusieurs archives et prototypes sur le lecteur `F:`.

La production est donc plus avancée que `main`, mais sa source n’était pas reproductible depuis le dépôt. La première action a été de sauvegarder exactement le déploiement observé, puis de figer l’état Git historique avant de créer la branche Pyrénées.

## Production observée

- domaine de référence : `https://www.infodrop.live/` ;
- interface affichée : v5.0 ;
- compteur observé pendant l’audit : environ 2 700 articles et 65 sources ;
- flux général derrière une connexion, avec favoris, statistiques, filtres par orientation et administration ;
- application Vite/Alpine, PWA et fonctions Vercel ;
- erreur console reproductible dans l’ancien lecteur : calcul de durée sur `readerContent` nul ; corrigée dans la branche de travail ;
- aucun déploiement ni réglage distant modifié pendant l’audit.

## GitHub

- branche : `main` ;
- commit audité : `f67b754` ;
- structure : grande page `index.html`, quiz, analyses 360° et API d’invitations ;
- écart : les sources Vite réellement déployées n’étaient pas présentes dans GitHub ;
- `F:\infodrop-main` partageait le même squelette mais six fichiers différaient du commit GitHub.

## Vercel

- projet : `infodrop` ;
- dépôt lié : `L0r4py/infodrop` ;
- déploiement de production audité : `dpl_BbTX42iPRrJxGybHvq92XcuNqkg1`, créé le 25 février 2026 ;
- origine indiquée : déploiement CLI, sans commit Git associé ;
- plan observé : Hobby ;
- aucune tâche planifiée enregistrée et aucun bloc `crons` dans le `vercel.json` déployé ;
- variables présentes par leur nom uniquement : Supabase, Stripe, administrateurs et secret de cron ; aucune valeur secrète n’a été exportée ;
- le tableau de bord signalait `SUPABASE_SERVICE_KEY` et `CRON_SECRET` comme secrets à mieux qualifier/faire tourner.

Limite structurante : le plan Hobby n’autorise une tâche Vercel Cron qu’une fois par jour, avec une précision à l’heure. Il ne peut donc pas assurer seul un fil réellement actualisé en continu. Référence : [Vercel, Usage & Pricing for Cron Jobs](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## Supabase

Projet de production observé en lecture seule.

Tables et vues visibles :

- `actu`, `purge_logs`, `scraped_articles`, `scraping_templates` ;
- `custom_sources`, `custom_sources_stats` ;
- `achievements`, `user_achievement_history`, `user_gaming_stats`, `user_actions` ;
- `invitation_codes`, `invitation_stats` ;
- `low_diversity_topics`, `user_diversity_data` ;
- `user_bookmarks`, `user_preferences`, `user_read_articles` ;
- `stats_today`.

La table `actu` comportait : `id`, `resume`, `source`, `url`, `heure`, `tag`, `added_by`, `created_at`, `orientation`, `tags`, une contrainte unique sur `url`, une limite de 180 caractères sur `resume` et un déclencheur anti-doublon.

La sécurité RLS était active mais comportait plusieurs politiques de lecture publique qui se recouvrent. La nouvelle migration n’en supprime aucune ; une consolidation devra être préparée puis validée séparément afin de ne pas casser l’édition générale.

## Ingestion et fenêtre de 24 heures

Le déploiement contenait :

- `api/parse-rss.js`, avec une liste codée en dur de sources généralistes et des étiquettes d’orientation ;
- `api/daily-purge.js`, protégé par `CRON_SECRET` ;
- aucune planification Vercel active pour lancer ces fonctions ;
- une actualisation du navigateur toutes les 30 secondes, qui relit la base mais ne déclenche pas l’ingestion.

Conclusion : la fenêtre de 24 heures existe dans le code de lecture et de purge, mais l’automatisation de l’alimentation n’est pas démontrée par la configuration déployée.

## Risques relevés

1. **Reproductibilité** : production non reconstruisible depuis `main` avant la présente synchronisation.
2. **Planification** : absence de scheduler et limite du plan Hobby.
3. **Secret serveur** : fonction de diagnostic Auth déployée inutilement ; désormais archivée hors de la surface active.
4. **Administration** : liste d’administrateurs exposée au client par nécessité historique ; l’édition locale n’en dépend pas.
5. **Documentation** : README de production encore centré sur le club privé et la gamification.
6. **Données locales** : aucun champ géographique structuré avant la migration Pyrénées.
7. **Politiques RLS** : plusieurs règles redondantes sur `actu`.

## Décision d’architecture

- conserver l’édition générale à la racine ;
- servir `/` et `/pyrenees/` avec la même interface de référence et un sélecteur d’édition discret ;
- rendre les deux flux publics, avec état personnel local et synchronisation email facultative ;
- garder le schéma historique tant que l’activation régionale n’est pas explicitement validée ;
- ajouter seulement des tables/colonnes régionales ;
- séparer le registre des sources et la qualification territoriale de l’ancienne liste nationale ;
- ne publier qu’après migration contrôlée, choix d’un scheduler compatible et validation mobile.

Le classement officiel du Parc est confirmé par le [décret n° 2026-606 du 9 juillet 2026](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000054407686). Le périmètre éditorial s’appuie sur ce cœur officiel, sans transformer toute actualité départementale en actualité locale.
