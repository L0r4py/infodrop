# Sources de l’édition Pyrénées

Registre contrôlé le 25 septembre 2026. La version exploitable par l’application se trouve dans `public/config/sources-pyrenees.json`.

## État du registre

- 19 flux actifs ;
- 19 flux réussis sur deux passages consécutifs ;
- délai maximal de 12 secondes par lecture ;
- titres, liens HTTP(S), dates et présence d’articles contrôlés ;
- sources non fiables conservées hors production dans `sources-to-investigate.md`.

Le rapport daté et reproductible est disponible dans `SOURCE_VERIFICATION_2026-09-25.md`. Le catalogue initial complet reste archivé dans `source-candidates-snapshot-2026-09-25.json`.

## Flux actifs

Le registre comprend des collectivités de proximité, des organismes publics, des médias locaux et des sources thématiques. Les URL exactes, le périmètre de filtrage et la date de vérification sont versionnés dans `public/config/sources-pyrenees.json`; le résultat article par article est résumé dans le rapport de vérification.

## Méthode de validation

Une source passe en `active: true` seulement si :

1. l’éditeur et la page d’origine sont identifiés ;
2. le flux réussit deux téléchargements et parsings consécutifs ;
3. chaque échantillon contient des articles avec titre, lien et date valides ;
4. le dernier article n’est ni périmé de plus de 180 jours, ni daté artificiellement dans le futur ;
5. le périmètre par défaut et le besoin d’un mot-clé territorial sont explicites ;
6. la date de vérification est enregistrée.

Une URL de type `/feed/` supposée mais non confirmée reste inactive. Les services d’alerte officiels ne sont pas aspirés tant que leur API, leur licence et leur fréquence raisonnable ne sont pas validées.

## Santé des sources

Chaque collecte enregistre le statut, la durée de réponse et le nombre d’articles qualifiés. Une erreur de source ne doit jamais faire échouer tout le lot. Les messages d’erreur restent bornés et ne contiennent aucune clé ou donnée personnelle.
