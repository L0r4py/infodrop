# Architecture National / Pyrénées

## Interface partagée

`/` et `/pyrenees/` servent le même `index.html`, les mêmes styles et les mêmes composants. L’édition est déterminée par l’URL et le sélecteur National/Pyrénées ne change que le flux consulté. Il n’existe ni landing page locale, ni palette secondaire, ni copie publique du cahier des charges.

La référence visuelle reste la production `infodrop.live` : Inter, fond `#0a0a0a`, accent `#FF2D55`, largeur `max-w-3xl`, header et cartes historiques. Les ajouts visuels se limitent au sélecteur d’édition et aux informations directement utiles dans les cartes locales.

## Périmètre éditorial

Les anciens codes `core`, `functional_ring` et `cross_border` restent conservés pour compatibilité en base. L’interface utilise désormais six zones territoriales compréhensibles :

| Code public | Libellé | Couleur |
| --- | --- | --- |
| `barousse` | Barousse | `#30D158` |
| `comminges` | Comminges | `#0A84FF` |
| `luchonnais` | Luchonnais | `#BF5AF2` |
| `nestes_lannemezan` | Nestes / Lannemezan | `#FF9F0A` |
| `hautes_pyrenees` | Hautes-Pyrénées | `#FF453A` |
| `val_aran` | Val d’Aran | `#64D2FF` |

La couleur est limitée aux badges, points et accents de zone. Le fond noir et l’accent de marque `#FF2D55` restent inchangés.

La qualification dépend du profil de la source :

- `trusted_local` : le périmètre propre d’une source hyperlocale suffit ;
- `department_65` : un contenu départemental 65 est admis sans exiger une commune précise ;
- `south_31` : le nord du département et Toulouse restent exclus sans lien avec le sud 31 ;
- `regional_strict`, `pyrenees_strict` et `specialized_strict` : un lieu, bassin, axe ou impact du périmètre doit être explicite.

Le champ `relevance_level` distingue `core`, `department`, `cross_border` et `regional_relevant`. Une mention de l’Occitanie seule ne suffit jamais.

## Flux de données

```text
Registre public vérifié
        │
        ├── flux RSS actifs ──> api/parse-local-rss.js
        │                            │
        │                            ├── dates valides + fenêtre 24 h
        │                            ├── qualification source-aware
        │                            ├── catégorie, zone et paywall
        │                            ├── déduplication URL puis titre/domaine
        │                            └── écritures + compteurs par source
        │                                      │
        └── pages en veille              Supabase actu
                                                │
                                    interface Infodrop partagée
```

Le registre JSON est la source lisible et versionnée. La table `regional_sources` en devient le miroir opérationnel lors de la collecte, y compris pour conserver une source retirée avec `active = false`. Le lot `config/source-candidates-pyrenees.json` reste séparé : un endpoint peut y être testé depuis Vercel sans activation et sans écriture en base.

Chaque collecte conserve `items_fetched`, `items_in_24h`, `items_rejected_territory`, `items_rejected_invalid_date`, `items_duplicate`, `items_written`, `last_feed_item_at` et `last_qualified_item_at`. Les dix derniers refus par source sont enregistrés dans `regional_source_diagnostics`, sous RLS sans droit de lecture public.

## Accès et données personnelles

Le flux est chargé dès l’ouverture, avec ou sans session. Un identifiant aléatoire local distingue l’appareil sans être envoyé au serveur. Lectures, favoris et préférence de masquage sont stockés par édition dans `localStorage`, avec une limite de 500 éléments par collection.

L’email/magic link est une option de synchronisation. Lorsqu’une session existe, l’état local est fusionné avec les tables Supabase historiques. La migration ajoute `edition_slug` aux lectures et favoris afin d’isoler National et Pyrénées. Avant migration, l’édition Pyrénées reste strictement locale pour éviter de mélanger les deux historiques.

## Compatibilité progressive

L’option publique `REGIONAL_SCHEMA_ENABLED` vaut `false` par défaut. Elle doit passer à `true` seulement après application et validation de la migration. Ce garde-fou évite des requêtes en erreur sur une base encore historique.

## Données ajoutées

La migration ajoute :

- `edition_slug`, `territory_zone`, `locality`, `category` ;
- `source_kind`, `source_slug`, `canonical_url`, `is_paywalled`, `ingested_at` ;
- `display_zone` et `relevance_level` ;
- `regional_sources` et `regional_source_checks` ;
- `regional_source_diagnostics`, privé ;
- les index adaptés à la lecture par édition et par zone.
- `get_edition_stats(text)`, fonction publique limitée à l’édition demandée, sans remplacer `get_live_stats`.

Les tables historiques ne sont ni supprimées ni renommées.

## Déduplication

La clé principale reste l’URL, après :

- suppression du fragment ;
- retrait des paramètres `utm_*`, `fbclid`, `gclid` et assimilés ;
- normalisation du domaine et du slash final ;
- repli sur le titre normalisé si aucune URL n’est disponible.

Le déclencheur historique `prevent_duplicate_urls` reste en place. Le collecteur recherche donc d’abord les URL canoniques existantes, met explicitement à jour les lignes locales déjà présentes, puis insère seulement les nouvelles lignes. Si la même URL existe déjà dans l’édition nationale, la ligne locale conserve l’URL canonique et reçoit un fragment technique distinct sur la colonne historique `url`.

## Planification

Le workflow `.github/workflows/collect-pyrenees.yml` appelle la fonction serveur toutes les quinze minutes. Il exige que toutes les sources actives contrôlées réussissent, sans recopier leur nombre dans le workflow ; le secret d’autorisation n’est jamais envoyé au navigateur.

## Sécurité

- la clé anonyme Supabase reste la seule clé reçue par le navigateur ;
- la clé de service n’est utilisée que par les fonctions serveur ;
- la collecte exige `Authorization: Bearer <CRON_SECRET>` ;
- aucune adresse d’administrateur n’est nécessaire pour lire l’un des flux ;
- aucune donnée personnelle n’est créée pour un visiteur anonyme ;
- la synchronisation distante n’est déclenchée qu’après identification volontaire.

## Nommage

Nom retenu pour la V1 : **Infodrop Pyrénées**.

Alternatives conservées pour une évolution éditoriale :

- **Infodrop Comminges–Barousse** : précis mais moins lisible hors du cœur du Parc ;
- **Le Fil des Vallées** : chaleureux mais moins clairement rattaché à Infodrop ;
- **Infodrop Territoires** : extensible à d’autres éditions, moins distinctif pour ce lancement.

La structure `edition_slug` permet d’ajouter plus tard d’autres routes sans dupliquer la base applicative.
