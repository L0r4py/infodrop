# Checklist de mise en production

Cette branche n’est pas publiée automatiquement.

## 1. Avant toute modification distante

- vérifier que `archive/legacy-gamified-2026-09-25` et `legacy-gamified-v1-2026-09-25` existent ;
- conserver le bundle de production et son SHA-256 ;
- relire le diff limité aux fichiers approuvés ;
- exécuter `git diff --check` puis `npm run validate` ;
- vérifier visuellement `/`, `/pyrenees/` et `/pyrénées/` en 390 px et 1440 px.

## 2. Base de données

- sauvegarder Supabase ;
- exécuter la migration additive en préproduction ;
- confirmer les nouvelles colonnes sur `actu` ;
- vérifier les politiques RLS avec un client anonyme ;
- lancer `parse-local-rss` sur une seule source avec `?source=cagire-garonne-salat` ;
- contrôler l’upsert, la déduplication, la fenêtre 24 h et la table de santé ;
- définir `REGIONAL_SCHEMA_ENABLED=true` seulement après ces contrôles ;
- ne supprimer aucune table historique.

## 3. Planification

Le plan Vercel Hobby observé n’accepte qu’une exécution cron par jour. Pour un fil réellement continu, choisir explicitement l’une de ces solutions avant publication :

- passer le projet sur un plan autorisant une fréquence adaptée ;
- utiliser un scheduler externe fiable avec stockage sécurisé de `CRON_SECRET` ;
- déclencher la collecte depuis une infrastructure existante documentée.

Ne pas ajouter un cron quotidien en le présentant comme du temps réel.

## 4. Secrets et environnement

- faire tourner `SUPABASE_SERVICE_KEY` et `CRON_SECRET` si leur historique est incertain ;
- enregistrer ces deux valeurs comme secrets serveur ;
- vérifier que seule la clé anonyme est envoyée au navigateur ;
- ne pas restaurer `api/test-env.js` dans la surface active ;
- contrôler `ADMIN_EMAILS` et `STRIPE_LINK` sans valeur de repli codée en dur.

## 5. Déploiement progressif

1. aperçu Vercel sans domaine de production ;
2. test fonctionnel de l’édition générale ;
3. test public sans session de `/` et `/pyrenees/`, puis test facultatif du magic link ;
4. vérification PWA, navigation hors ligne et liens externes ;
5. validation des compteurs et de l’âge des sources ;
6. bascule de production uniquement après accord explicite.

## 6. Retour arrière

- retour applicatif : redéployer le dernier déploiement stable ;
- retour Git : repartir du tag `legacy-gamified-v1-2026-09-25` ou du commit de production synchronisé ;
- base : la migration est additive, donc les anciennes fonctions continuent d’exister ; une suppression des nouvelles colonnes n’est pas requise pour revenir à l’ancienne interface.
