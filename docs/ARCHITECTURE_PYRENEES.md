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
| `occitanie` | Occitanie | veille régionale pertinente et compatibilité des anciennes données |

Les anciens codes `core`, `functional_ring` et `cross_border` restent acceptés en base pour préserver les lignes historiques, mais les nouvelles collectes utilisent la taxonomie ci-dessus.

Depuis le 10 octobre 2026, le cœur reste Comminges, Barousse et Pyrénées. Une veille élargie Toulouse, Haute-Garonne, Hautes-Pyrénées, Ariège et Occitanie est autorisée, mais ne verse au flux principal que les sujets liés au cœur ou ayant un impact régional explicite. Actu Toulouse est le premier flux de cette veille ; les rubriques locales déjà actives restent inchangées.

## Chaîne de collecte

```text
Registre public vérifié
        │
        ├── flux RSS actifs ──> api/parse-local-rss.js
        │                            │
        │                            ├── date réelle obligatoire
        │                            ├── fenêtre glissante de 24 h
        │                            ├── pertinence locale pour les seuls flux de veille élargie
        │                            ├── catégorie, territoire et paywall
        │                            ├── déduplication URL / titre proche
        │                            └── écriture et diagnostic par source
        │                                      │
        └── sources en veille            Supabase `actu`
                                                │
                                   interface Infodrop partagée
```

Le registre JSON est la source versionnée. `regional_sources` en est le miroir opérationnel et conserve aussi les sources inactives. `regional_source_checks` contient les compteurs de diagnostic de chaque passage.

Pour les rubriques locales, le périmètre reste décidé par la sélection du RSS : date réelle, H24, exclusion des bulletins météo automatiques et déduplication, sans nouveau filtre géographique. Zone et localité restent celles du registre.

Seules les sources portant `admission: local-relevance` utilisent `lib/local/watch-relevance.js`. Le filtre lit le titre, le descriptif RSS, les catégories de l'item et le code communal de son URL, jamais le nom du média ou du flux. Il reconnaît les communes du cœur, les secteurs pyrénéens et les effets régionaux explicites (alertes, transports, services publics, aides). Un simple tag Occitanie, Haute-Garonne ou Toulouse ne suffit pas. La zone peut alors provenir de la commune reconnue ; un impact régional garde `occitanie`. Le compteur existant `items_rejected_territory` mesure les rejets de cette veille uniquement. Aucun changement National ni nouvelle migration.

Le référentiel `public/config/pyrenees-watch-territory.json` est une photographie datée de l'[API officielle Découpage administratif](https://geo.api.gouv.fr/decoupage-administratif/epcis) pour les intercommunalités Cagire Garonne Salat, Cœur et Coteaux du Comminges, Pyrénées Haut Garonnaises et Neste Barousse. Il ne nécessite aucun appel géographique pendant la collecte. Les autres communes du 65 sont reconnues par leur code dans l'URL ; les secteurs Pyrénées/Aran peuvent également être explicitement nommés dans l'item.

« Toutes les sources » présente le registre complet et les derniers contrôles publics, avec une lecture séparée du dernier passage ayant écrit un article. Une source sans item H24 peut être saine. Un contrôle datant de plus d'une heure est signalé comme ancien. La diversification Pyrénées conserve le premier article et ne réordonne que des cartes distantes de quinze minutes au maximum, dans un voisinage de huit cartes ; elle ne supprime aucun article.

## Statistiques publiques H24

- `get_edition_stats(text)` retourne les volumes, orientations, thèmes et zones actifs pour l’édition demandée ;
- `get_edition_source_stats(text)` retourne chaque source réellement active dans les dernières 24 heures, son volume et l’URL de son article le plus récent ;
- `get_live_stats` reste inchangée pour la compatibilité historique.

## Déduplication

La clé principale reste l’URL canonique après retrait des fragments et paramètres de suivi. Le collecteur rapproche aussi les titres très proches uniquement lorsqu’ils viennent du même domaine, puis conserve la source prioritaire ou la publication la plus récente. Le déclencheur historique `prevent_duplicate_urls` reste en place.

## Accès et données personnelles

Le flux est public et chargé sans session. Lectures, favoris et préférence de masquage restent stockés par édition sur l’appareil. L’email/magic link demeure facultatif pour la synchronisation. La clé de service Supabase et `CRON_SECRET` restent exclusivement côté serveur.

## Planification

Cron-Job.org appelle le National et la purge toutes les 30 minutes, et Pyrénées toutes les 15 minutes. GitHub Actions Pyrénées reste manuel uniquement, sans nouvelle planification. Voir [SCHEDULERS.md](SCHEDULERS.md).

Les tables historiques ne sont ni supprimées ni renommées. Les migrations restent additives et les anciens codes territoriaux sont conservés pour compatibilité.
