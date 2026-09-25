# Sources locales à investiguer

Ces sources sont pertinentes sur le plan éditorial, mais ne figurent pas dans le registre actif tant que leur récupération n’est pas suffisamment fiable. Le dernier contrôle a été réalisé le 25 septembre 2026. Le catalogue de travail complet est conservé dans `docs/source-candidates-snapshot-2026-09-25.json`.

## Flux trouvé mais non exploitable en continu

| Source | État observé | Suite possible |
|---|---|---|
| PNR Comminges Barousse Pyrénées | Le flux `/feed/` répond mais ne contient aucun article sur deux lectures. | Identifier le type de contenu WordPress réellement utilisé ou prévoir un adaptateur. |
| InfoRoute65 | Flux valide techniquement, mais dernier article daté de novembre 2022. | Étudier la donnée opérationnelle du site plutôt que son ancien flux éditorial. |
| Hôpitaux de Lannemezan | Flux valide techniquement, mais dernier article daté de janvier 2023. | Vérifier une autre rubrique ou un autre canal officiel. |
| ICI / France Bleu | Le flux générique mélange toutes les stations et contient des publications programmées dans le futur. | Trouver un flux propre à ICI Occitanie ou ICI Béarn Bigorre. |

## Page utile sans flux exploitable découvert

- Préfecture de la Haute-Garonne
- Préfecture des Hautes-Pyrénées
- Département de la Haute-Garonne
- Région Occitanie
- Ville de Lannemezan
- Ville de Montréjeau
- Cœur & Coteaux Comminges
- SDIS 65
- Inforoute 31
- TER Occitanie
- Chambres d’agriculture de la Haute-Garonne et des Hautes-Pyrénées
- France 3 Occitanie
- Aué TV
- Vielha e Mijaran
- Protecció Civil de Catalunya

## Source nécessitant plutôt une API ou un adaptateur spécialisé

- Météo-France Vigilance
- Vigicrues
- Meteocat

Ces sources ne doivent pas être activées par simple supposition d’URL. Elles pourront être ajoutées après validation d’un connecteur stable, de la fréquence de mise à jour et des conditions d’utilisation.
