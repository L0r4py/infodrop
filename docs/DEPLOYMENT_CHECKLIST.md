# Checklist de mise en production

État au 26 septembre 2026 : cette checklist a été exécutée jusqu’au smoke test public pour la version initiale National + Pyrénées. Les correctifs source-aware, zones et observabilité ajoutés ensuite dans le dépôt ne sont pas considérés comme déployés tant que la migration `202609260002_infodrop_pyrenees_correctifs.sql`, les probes candidats et un nouveau smoke test public n’ont pas été validés.

## 1. Avant toute modification distante

- vérifier que `archive/legacy-gamified-2026-09-25` et `legacy-gamified-v1-2026-09-25` existent ;
- conserver le bundle de production et son SHA-256 ;
- relire le diff limité aux fichiers approuvés ;
- exécuter `git diff --check` puis `npm run validate` ;
- vérifier visuellement `/`, `/pyrenees/` et `/pyrénées/` en 390 px et 1440 px.

## 2. Base de données

- sauvegarder Supabase : snapshot local contrôlé avec manifeste SHA-256 ;
- exécuter les migrations additives dans une transaction ;
- appliquer `202609260002_infodrop_pyrenees_correctifs.sql` avant de déployer le nouveau collecteur ;
- confirmer les nouvelles colonnes sur `actu` et la compatibilité de `user_bookmarks.article_id` en texte ;
- vérifier les politiques RLS et les fonctions avec un client anonyme ;
- lancer `parse-local-rss` sur la preview Vercel ;
- tester séparément chaque candidat localement validé avec `/api/parse-local-rss?candidate=<slug>` ; ce mode ne doit écrire ni source ni article ;
- contrôler les écritures explicites, la déduplication, la fenêtre 24 h et la table de santé ;
- définir `REGIONAL_SCHEMA_ENABLED=true` seulement après ces contrôles ;
- ne supprimer aucune table historique.

## 3. Planification

Le plan Vercel Hobby observé n’accepte qu’une exécution cron par jour. La collecte Pyrénées utilise donc GitHub Actions toutes les quinze minutes, avec `CRON_SECRET` stocké dans les secrets du dépôt. Le workflow échoue si aucune source n’est contrôlée, si le nombre de réussites diffère du nombre de sources actives ou si l’une d’elles échoue.

## 4. Secrets et environnement

- faire tourner `SUPABASE_SERVICE_KEY` et `CRON_SECRET` si leur historique est incertain ;
- enregistrer ces deux valeurs comme secrets serveur ;
- vérifier que seule la clé anonyme est envoyée au navigateur ;
- ne pas restaurer `api/test-env.js` dans la surface active ;
- contrôler `ADMIN_EMAILS` et `STRIPE_LINK` sans valeur de repli codée en dur.

## 5. Déploiement progressif

1. aperçu Vercel sans domaine de production ;
2. test fonctionnel de l’édition générale ;
3. test public sans session de `/` et `/pyrenees/` ;
4. vérification desktop et mobile, recherche, filtres et sources ;
5. validation des compteurs par édition, favoris, lectures et préférences locales ;
6. collecte serveur avec toutes les sources actives réussies et compteurs par source cohérents ;
7. bascule de production uniquement après accord explicite ;
8. smoke test complet du domaine public et du workflow planifié.

## 6. Retour arrière

- retour applicatif : redéployer le dernier déploiement stable ;
- retour Git : repartir du tag `legacy-gamified-v1-2026-09-25` ou du commit de production synchronisé ;
- base : la migration est additive, donc les anciennes fonctions continuent d’exister ; une suppression des nouvelles colonnes n’est pas requise pour revenir à l’ancienne interface.

## 7. Validation de la version initiale du 26 septembre 2026

- snapshot Supabase réalisé avant migration et contrôlé par SHA-256 ;
- migrations additives appliquées sans suppression de table ni de fonction historique ;
- deux collectes de preview puis une collecte de production à 19/19 sources locales ;
- flux National et Pyrénées contrôlés avec des données réelles ;
- recherche, filtres, liste des sources, lectures, favoris et préférences locales validés sans compte ;
- rendu bureau et mobile contrôlé sans débordement ni erreur console ;
- ancien déploiement Vercel, branche d’archive et tag historique conservés.
