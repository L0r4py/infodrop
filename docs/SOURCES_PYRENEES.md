# Sources de l’édition Pyrénées

Le registre actif contrôlé le 25 septembre 2026 se trouve dans `public/config/sources-pyrenees.json`. Le lot complémentaire audité le 26 septembre se trouve dans `config/source-candidates-pyrenees.json` et reste séparé tant que le contrôle Vercel n’est pas passé.

## État du registre

- 19 flux actifs ;
- 19 flux réussis sur deux passages consécutifs ;
- délai maximal de 12 secondes par lecture ;
- titres, liens HTTP(S), dates et présence d’articles contrôlés ;
- sources non fiables conservées hors production dans `sources-to-investigate.md`.

Le 26 septembre, 22 endpoints complémentaires ont été lus deux fois avec le parseur réel : 18 ont réussi et 4 ont été écartés avec une cause explicite. Aucun de ces 18 candidats n’est actif sur la seule foi du contrôle local. Le détail est dans `SOURCE_VERIFICATION_2026-09-26.md`.

Le rapport daté et reproductible est disponible dans `SOURCE_VERIFICATION_2026-09-25.md`. Le catalogue initial complet reste archivé dans `source-candidates-snapshot-2026-09-25.json`.

## Flux actifs

Le registre comprend des collectivités de proximité, des organismes publics, des médias locaux et des sources thématiques. Les URL exactes, le périmètre de filtrage et la date de vérification sont versionnés dans `public/config/sources-pyrenees.json`; le résultat article par article est résumé dans le rapport de vérification.

## Méthode de validation

Une source passe en `active: true` seulement si :

1. l’éditeur et la page d’origine sont identifiés ;
2. le flux réussit deux téléchargements et parsings consécutifs ;
3. chaque échantillon contient des articles avec titre, lien et date valides ;
4. le dernier article n’est ni périmé de plus de 180 jours, ni daté artificiellement dans le futur ;
5. la politique territoriale (`trusted_local`, `department_65`, `south_31` ou stricte) et la zone publique par défaut sont explicites ;
6. la date de vérification est enregistrée ;
7. le même candidat réussit ensuite un probe autorisé depuis l’environnement Vercel, sans écriture en base.

Une URL de type `/feed/` supposée mais non confirmée reste inactive. Les services d’alerte officiels ne sont pas aspirés tant que leur API, leur licence et leur fréquence raisonnable ne sont pas validées.

## Santé des sources

Chaque collecte enregistre le statut, la durée de réponse et les compteurs suivants :

- `items_fetched` ;
- `items_in_24h` ;
- `items_rejected_territory` ;
- `items_rejected_invalid_date` ;
- `items_duplicate` ;
- `items_written` ;
- `last_feed_item_at` ;
- `last_qualified_item_at`.

Une erreur de source ne doit jamais faire échouer le traitement des autres flux. Les messages d’erreur restent bornés et ne contiennent aucune clé ou donnée personnelle. Les dix derniers refus sont conservés dans une table privée, sans politique de lecture anonyme ou authentifiée.
