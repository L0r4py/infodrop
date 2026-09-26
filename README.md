# Infodrop

Infodrop conserve son édition nationale/internationale à la racine et ajoute une édition locale à l’adresse `/pyrenees/` (alias `/pyrénées/`). Les deux éditions utilisent la même application, la même charte et les mêmes composants que la version de référence `infodrop.live`. Un sélecteur discret permet de passer de l’une à l’autre.

La version produit a une seule source de vérité : le champ `version` de `package.json`. L’interface À propos l’importe au build et ne recopie aucun numéro en dur.

## Fonctionnement

- le flux est public et ne dépend pas d’une session ;
- les lectures, favoris et préférences sont conservés sur l’appareil avec `localStorage` ;
- l’identification par email/magic link reste facultative et sert uniquement à synchroniser ces données entre appareils ;
- l’édition Pyrénées est classée par thème et n’affiche pas d’étiquette politique ;
- 19 flux locaux actifs ont réussi les contrôles locaux et deux collectes complètes depuis Vercel les 25 et 26 septembre 2026 ;
- filtrage dépendant du type de source : hyperlocal, département 65, sud 31 ou régional strict ;
- six zones publiques avec couleurs sémantiques, sans modifier la charte noire et rose ;
- diagnostic par source distinguant items bruts, H24, rejets territoriaux, dates invalides, doublons et écritures ;
- déduplication par URL canonique, puis par titre très proche sur un même domaine ;
- signalement des accès abonnés lorsqu’ils sont détectés ;
- même fond, couleurs, typographie, cartes, header, proportions et comportement mobile que l’édition existante.

La migration régionale initiale est appliquée en production. Le correctif `202609260002_infodrop_pyrenees_correctifs.sql` doit être appliqué avant de déployer le collecteur source-aware. `REGIONAL_SCHEMA_ENABLED=true` active les champs régionaux, les statistiques séparées par édition et la synchronisation multi-appareils sans modifier les tables historiques.

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

Cette commande exécute les tests et la construction Vite. Le contrôle réel des 19 flux actifs se relance avec `node scripts/verify-local-sources.mjs`. Le lot complémentaire se contrôle avec `node scripts/verify-local-sources.mjs --candidates` ; chaque candidat doit ensuite réussir un probe Vercel autorisé avant activation. Avant toute publication, suivre aussi [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md).

## Documentation

- [Audit de l’état actuel](docs/AUDIT_CURRENT_STATE.md)
- [Architecture de l’édition Pyrénées](docs/ARCHITECTURE_PYRENEES.md)
- [Registre et méthode de sélection des sources](docs/SOURCES_PYRENEES.md)
- [Vérification ciblée des compléments du 26 septembre](docs/SOURCE_VERIFICATION_2026-09-26.md)
- [Conservation et restauration de l’ancien projet](docs/LEGACY_ARCHIVE.md)
- [Checklist de mise en production](docs/DEPLOYMENT_CHECKLIST.md)
- [Compte rendu de mise en production du 26 septembre 2026](docs/RELEASE_2026-09-26.md)

## Statut

La version National + Pyrénées est en production sur `infodrop.live` depuis le 26 septembre 2026. Les 19 sources locales actives répondent et le déploiement historique reste disponible pour un retour arrière. Le correctif de filtrage, d’observabilité, de zones et le lot de 18 candidats validés localement sont préparés dans ce dépôt mais ne sont pas présentés comme déployés tant que la migration et les probes Vercel n’ont pas été exécutés. Les preuves de la version actuellement publiée et les identifiants de restauration sont consignés dans [docs/RELEASE_2026-09-26.md](docs/RELEASE_2026-09-26.md).
