# Architecture National / Pyrénées

## Interface partagée

`/` et `/pyrenees/` servent le même `index.html`, les mêmes styles et les mêmes composants. L’édition est déterminée par l’URL et le sélecteur National/Pyrénées ne change que le flux consulté. Il n’existe ni landing page locale, ni palette secondaire, ni copie publique du cahier des charges.

La référence visuelle reste la production `infodrop.live` : Inter, fond `#0a0a0a`, accent `#FF2D55`, largeur `max-w-3xl`, header et cartes historiques. Les ajouts visuels se limitent au sélecteur d’édition et aux informations directement utiles dans les cartes locales.

## Périmètre éditorial

La V1 utilise trois zones explicites :

| Code | Libellé public | Fonction |
| --- | --- | --- |
| `core` | Cœur du Parc | communes et vallées du PNR Comminges Barousse Pyrénées |
| `functional_ring` | Bassins de vie | Saint-Gaudens, Montréjeau, Lannemezan et impacts structurants |
| `cross_border` | Val d’Aran | continuité frontalière immédiatement utile |

Une information extérieure n’est retenue que si son titre ou ses métadonnées mentionnent explicitement un lieu, un axe ou un impact territorial. Tarbes, Toulouse, Pau ou Foix ne suffisent pas à eux seuls.

## Flux de données

```text
Registre public vérifié
        │
        ├── flux RSS actifs ──> api/parse-local-rss.js
        │                            │
        │                            ├── fenêtre 24 h
        │                            ├── qualification territoriale
        │                            ├── catégorie et paywall
        │                            └── URL canonique + upsert
        │                                      │
        └── pages en veille              Supabase actu
                                                │
                                    interface Infodrop partagée
```

Le registre JSON est la source lisible et versionnée. La table `regional_sources` en devient le miroir opérationnel lors de la collecte. Les règles territoriales restent dans le collecteur et la documentation ; elles ne sont pas affichées dans le flux public.

## Accès et données personnelles

Le flux est chargé dès l’ouverture, avec ou sans session. Un identifiant aléatoire local distingue l’appareil sans être envoyé au serveur. Lectures, favoris et préférence de masquage sont stockés par édition dans `localStorage`, avec une limite de 500 éléments par collection.

L’email/magic link est une option de synchronisation. Lorsqu’une session existe, l’état local est fusionné avec les tables Supabase historiques. La migration ajoute `edition_slug` aux lectures et favoris afin d’isoler National et Pyrénées. Avant migration, l’édition Pyrénées reste strictement locale pour éviter de mélanger les deux historiques.

## Compatibilité progressive

L’option publique `REGIONAL_SCHEMA_ENABLED` vaut `false` par défaut. Elle doit passer à `true` seulement après application et validation de la migration. Ce garde-fou évite des requêtes en erreur sur une base encore historique.

## Données ajoutées

La migration ajoute :

- `edition_slug`, `territory_zone`, `locality`, `category` ;
- `source_kind`, `source_slug`, `canonical_url`, `is_paywalled`, `ingested_at` ;
- `regional_sources` et `regional_source_checks` ;
- les index adaptés à la lecture par édition et par zone.

Les tables historiques ne sont ni supprimées ni renommées.

## Déduplication

La clé principale reste l’URL, après :

- suppression du fragment ;
- retrait des paramètres `utm_*`, `fbclid`, `gclid` et assimilés ;
- normalisation du domaine et du slash final ;
- repli sur le titre normalisé si aucune URL n’est disponible.

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
