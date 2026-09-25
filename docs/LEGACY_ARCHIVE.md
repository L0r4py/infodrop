# Conservation de l’histoire d’Infodrop

État de référence : 25 septembre 2026.

## Repères Git

L’état GitHub antérieur à l’édition locale est figé au commit `f67b75415bb993622ce3c85a6dd5d41146e5dbc9`.

- branche locale : `archive/legacy-gamified-2026-09-25`
- tag local annoté : `legacy-gamified-v1-2026-09-25`
- branche de travail moderne : `feature/infodrop-pyrenees-v1`

Commandes de consultation, sans modifier la branche courante :

```bash
git show legacy-gamified-v1-2026-09-25:quiz.html
git ls-tree -r --name-only archive/legacy-gamified-2026-09-25
```

Pour réactiver un fichier précis dans une future branche :

```bash
git restore --source legacy-gamified-v1-2026-09-25 -- quiz.html
```

## Archive embarquée dans la version moderne

Le dossier `archive/legacy-gamified/` conserve les éléments les plus identifiables :

- ancienne application monolithique avec gamification ;
- quiz et données du quiz ;
- analyses 360° et index des analyses ;
- API de vérification, validation et génération d’invitations ;
- ancien README décrivant le club privé, les niveaux et les statistiques.

Le diagnostic Vercel public `api/test-env.js`, qui utilisait la clé de service pour tester l’administration Auth, a été retiré de la surface active et déplacé dans `archive/legacy-production/api/`.

## Sauvegardes externes conservées en place

Ces dossiers n’ont été ni déplacés ni supprimés :

| Chemin | Fichiers | Taille observée | Rôle |
| --- | ---: | ---: | --- |
| `F:\infodrop-main` | 27 | 1 299 634 octets | variante statique de janvier 2026 |
| `F:\Infodrop test et backup` | 14 068 | 179 969 267 octets | archive principale de prototypes et sauvegardes |
| `F:\Infodropswip` | 545 | 8 201 314 octets | prototypes d’interface, invitations et 360° |

Le dossier `F:\Infodrop test et backup\infodrop-astro` contient un dépôt Git initialisé mais sans commit ; ses fichiers étaient tous non suivis lors de l’audit. Il ne doit donc pas être traité comme une sauvegarde Git fiable.

## Source exacte du déploiement Vercel observé

La source du déploiement de production du 25 février 2026 a été sauvegardée en dehors du dépôt :

- bundle : `C:\Users\Admin\Desktop\INFODROP\archives\vercel-deployment-2026-02-25\source-bundle.json`
- extraction : `C:\Users\Admin\Desktop\INFODROP\production-snapshot-2026-02-25`
- SHA-256 du bundle : `2938FF5F4B9B267D45763F464377548FC288817F8D3C458937CE00764DFC8F0C`

Cette sauvegarde permet de retrouver l’état réellement déployé même si la branche GitHub historique ne le contient pas.

## Base de données

La migration `supabase/migrations/202609250001_infodrop_pyrenees_v1.sql` n’exécute aucun `DROP`, ne renomme aucune table et ne modifie pas les données de gamification, quiz, invitations ou statistiques. Les anciennes tables restent récupérables pour une éventuelle réactivation.
