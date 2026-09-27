# Architecture National / Pyrénées

## Interface partagée

`/` et `/pyrenees/` servent le même `index.html`, les mêmes styles et les mêmes composants. L’édition est déterminée par l’URL. La référence visuelle reste la production Infodrop : Inter, fond `#0a0a0a`, accent `#FF2D55`, largeur `max-w-3xl`, header et cartes historiques.

La modale « Sources actives » ne dépend plus des 50 cartes chargées. Elle utilise les articles réellement présents dans la fenêtre glissante de 24 heures via `get_edition_source_stats(text)`, pour National comme pour Pyrénées.

## Périmètre éditorial

| Code | Libellé public | Couverture |
| --- | --- | --- |
| `barousse` | Barousse | Barousse et Neste-Barousse |
| `comminges` | Comminges | Saint-Gaudens, Montréjeau, Cagire, Salat et Comminges |
| `luchonnais` | Luchonnais | Bagnères-de-Luchon et vallées proches |
| `nestes_lannemezan` | Nestes / Lannemezan | Pays des Nestes, Aure, Louron et plateau de Lannemezan |
| `hautes_pyrenees` | Hautes-Pyrénées | département 65 |
| `haute_garonne_sud` | Haute-Garonne sud | sud du département 31 et Pyrénées haut-garonnaises |
| `val_aran` | Val d’Aran | continuité transfrontalière utile |
| `occitanie` | Occitanie | seulement lorsqu’un impact territorial est explicite |

Les anciens codes `core`, `functional_ring` et `cross_border` restent acceptés en base pour préserver les lignes historiques, mais les nouvelles collectes utilisent la taxonomie ci-dessus.

## Chaîne de collecte

```text
Registre public vérifié
        │
        ├── flux RSS actifs ──> api/parse-local-rss.js
        │                            │
        │                            ├── date réelle obligatoire
        │                            ├── fenêtre glissante de 24 h
        │                            ├── filtrage selon la portée de la source
        │                            ├── catégorie, zone et paywall
        │                            ├── déduplication URL / titre proche
        │                            └── écriture et diagnostic par source
        │                                      │
        └── sources en veille            Supabase `actu`
                                                │
                                   interface Infodrop partagée
```

Le registre JSON est la source versionnée. `regional_sources` en est le miroir opérationnel et conserve aussi les sources inactives. `regional_source_checks` contient les compteurs de diagnostic de chaque passage.

## Statistiques publiques H24

- `get_edition_stats(text)` retourne les volumes, orientations, thèmes et zones actifs pour l’édition demandée ;
- `get_edition_source_stats(text)` retourne chaque source réellement active dans les dernières 24 heures, son volume et l’URL de son article le plus récent ;
- `get_live_stats` reste inchangée pour la compatibilité historique.

## Déduplication

La clé principale reste l’URL canonique après retrait des fragments et paramètres de suivi. Le collecteur rapproche aussi les titres très proches uniquement lorsqu’ils viennent du même domaine, puis conserve la source prioritaire ou la publication la plus récente. Le déclencheur historique `prevent_duplicate_urls` reste en place.

## Accès et données personnelles

Le flux est public et chargé sans session. Lectures, favoris et préférence de masquage restent stockés par édition sur l’appareil. L’email/magic link demeure facultatif pour la synchronisation. La clé de service Supabase et `CRON_SECRET` restent exclusivement côté serveur.

## Planification

Cron-Job.org appelle le National et la purge toutes les 30 minutes. GitHub Actions appelle uniquement Pyrénées aux minutes 7, 22, 37 et 52 UTC. Sa validation repose sur le résultat dynamique de la collecte et ne contient aucun `sources_checked == 19`.

Les tables historiques ne sont ni supprimées ni renommées. Les migrations restent additives et les anciens codes territoriaux sont conservés pour compatibilité.
