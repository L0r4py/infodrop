# Sources locales à investiguer

Ces sources sont pertinentes sur le plan éditorial, mais ne figurent pas dans le registre actif tant que leur récupération n’est pas suffisamment fiable. Le dernier contrôle a été réalisé les 25 et 26 septembre 2026. Le catalogue historique est conservé dans `docs/source-candidates-snapshot-2026-09-25.json` et le lot actuel dans `config/source-candidates-pyrenees.json`.

## Flux trouvé mais non exploitable en continu

| Source | État observé | Suite possible |
|---|---|---|
| Atmo Occitanie | Le flux renvoie bien 10 articles et HTTP 200 en local, mais échoue de façon reproductible depuis Vercel après deux tentatives et environ 20 secondes. | Réévaluer l’accessibilité depuis l’infrastructure de production ou prévoir un relais officiel stable. |
| PNR Comminges Barousse Pyrénées | Le flux `/feed/` répond mais ne contient aucun article sur deux lectures. | Identifier le type de contenu WordPress réellement utilisé ou prévoir un adaptateur. |
| InfoRoute65 | Flux valide techniquement, mais dernier article daté de novembre 2022. | Étudier la donnée opérationnelle du site plutôt que son ancien flux éditorial. |
| Hôpitaux de Lannemezan | Flux valide techniquement, mais dernier article daté de janvier 2023. | Vérifier une autre rubrique ou un autre canal officiel. |
| Le Petit Journal — Comminges | Le feed répond, mais 4 items sur 10 n’ont pas de date exploitable sur deux lectures. | Demander une date fiable ou prévoir un adaptateur avant activation. |
| Cœur & Coteaux — Actualités | Le feed répond, mais contient un item sans date. | Corriger ou adapter la date manquante avant activation. |
| Cœur & Coteaux — Agenda | Le feed utilise des dates d’événements futures comme dates de publication. | Créer un traitement agenda distinct de la fenêtre éditoriale H24. |
| SDIS 65 | Le feed répond, mais son dernier item avait 214 jours lors du contrôle. | Conserver comme piste, sans le compter parmi les sources actives H24. |

## Page utile sans flux exploitable découvert

- Préfecture de la Haute-Garonne
- Préfecture des Hautes-Pyrénées
- Département de la Haute-Garonne
- Région Occitanie
- Ville de Lannemezan
- Ville de Montréjeau
- Inforoute 31
- TER Occitanie
- Chambres d’agriculture de la Haute-Garonne et des Hautes-Pyrénées
- Aué TV
- Vielha e Mijaran
- Protecció Civil de Catalunya

## Source nécessitant plutôt une API ou un adaptateur spécialisé

- Météo-France Vigilance
- Meteocat

Les feeds ciblés ICI Occitanie, ICI Béarn Bigorre, France 3 Haute-Garonne, France 3 Hautes-Pyrénées et Vigicrues ont été retrouvés et ont réussi les deux lectures locales du 26 septembre. Ils restent néanmoins candidats jusqu’au probe Vercel et, pour Vigicrues, jusqu’à confirmation du paramétrage territorial. Aucune source ne doit être activée par simple supposition d’URL.
