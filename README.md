# Infodrop

Infodrop conserve son édition nationale/internationale à la racine et ajoute une édition locale à l’adresse `/pyrenees/` (alias `/pyrénées/`). Les deux éditions utilisent la même application, la même charte et les mêmes composants que la version de référence `infodrop.live`. Un sélecteur discret permet de passer de l’une à l’autre.

## Fonctionnement

- le flux est public et ne dépend pas d’une session ;
- les lectures, favoris et préférences sont conservés sur l’appareil avec `localStorage` ;
- l’identification par email/magic link reste facultative et sert uniquement à synchroniser ces données entre appareils ;
- l’édition Pyrénées est classée par territoire et par thème, sans étiquette politique ;
- le périmètre couvre la Barousse, le Comminges, le Luchonnais, les Nestes/Lannemezan, les Hautes-Pyrénées, le sud de la Haute-Garonne, le Val d’Aran et l’Occitanie lorsqu’une information concerne directement cette zone ;
- chaque collecte locale distingue les items bruts, récents, rejetés par le territoire, invalides, dédupliqués et finalement écrits ;
- déduplication des URL et suppression des paramètres de suivi ;
- signalement des accès abonnés lorsqu’ils sont détectés ;
- même fond, couleurs, typographie, cartes, header, proportions et comportement mobile que l’édition existante.

`REGIONAL_SCHEMA_ENABLED=true` active les champs régionaux, les statistiques H24 séparées par édition et par source, ainsi que la synchronisation multi-appareils sans modifier les tables historiques.

## Histoire du projet préservée

Les quiz, la gamification, les analyses 360°, les invitations et les anciens composants n’ont pas été effacés. Ils sont conservés :

- dans `archive/legacy-gamified/` pour une consultation immédiate ;
- sur la branche locale `archive/legacy-gamified-2026-09-25` ;
- dans le tag local annoté `legacy-gamified-v1-2026-09-25` ;
- dans les sauvegardes historiques référencées dans [docs/LEGACY_ARCHIVE.md](docs/LEGACY_ARCHIVE.md).

Les tables Supabase historiques restent intactes. La migration Pyrénées est exclusivement additive.

## Démarrage local

Prérequis : Node.js 22.

```bash
npm ci
npm run dev
```

Ouvrir ensuite `http://localhost:3000/` ou `http://localhost:3000/pyrenees/`.

Variables attendues pour lire des données réelles :

```text
SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
REGIONAL_SCHEMA_ENABLED
```

Variables serveur nécessaires à la collecte :

```text
SUPABASE_SERVICE_KEY
CRON_SECRET
```

Ne jamais placer la clé de service dans le navigateur ou dans un fichier commité.

## Vérification

```bash
npm run validate
```

Cette commande exécute les tests et la construction Vite. Le contrôle réel des flux se relance avec `node scripts/verify-local-sources.mjs`. Avant toute publication, suivre aussi [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md).

## Documentation

- [Audit de l’état actuel](docs/AUDIT_CURRENT_STATE.md)
- [Architecture de l’édition Pyrénées](docs/ARCHITECTURE_PYRENEES.md)
- [Registre et méthode de sélection des sources](docs/SOURCES_PYRENEES.md)
- [Conservation et restauration de l’ancien projet](docs/LEGACY_ARCHIVE.md)
- [Checklist de mise en production](docs/DEPLOYMENT_CHECKLIST.md)
- [Compte rendu de mise en production du 26 septembre 2026](docs/RELEASE_2026-09-26.md)

## Statut

La version National + Pyrénées est en production sur `infodrop.live`. National et la purge sont planifiés par Cron-Job.org ; Pyrénées est planifié séparément par GitHub Actions. Le registre local est limité aux flux validés deux fois localement puis depuis Vercel, et le déploiement historique reste disponible pour un retour arrière. Les preuves de validation sont consignées dans les documents de release.
