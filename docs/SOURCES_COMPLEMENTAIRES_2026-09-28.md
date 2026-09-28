# Sources complémentaires Pyrénées — activation du 28 septembre 2026

Sept flux supplémentaires, sans modification du collecteur, du National, des dates, du périmètre par mots-clés ou du scheduler. Registre : 85 actifs / 99 entrées. Les nouveaux flux seront lus par le job Cron-Job.org `8523882`, toutes les quinze minutes.

## Flux activés

| Source / rubrique | RSS | Zone fixe | Dernière publication au contrôle du 27/09 |
| --- | --- | --- | --- |
| Fréquence Luz — actualités locales | https://frequenceluz.fr/podcasts/actu_locale/feed | Hautes-Pyrénées | 25/09/2026 |
| Fréquence Luz — sortir / culture | https://frequenceluz.fr/podcasts/sortir/feed | Hautes-Pyrénées | 24/09/2026 |
| Fréquence Luz — reportages | https://frequenceluz.fr/podcasts/reportage/feed | Hautes-Pyrénées | 10/09/2026 |
| Radio Présence — sports en Comminges | https://www.radiopresence.com/spip.php?id_rubrique=267&page=backend | Comminges | 20/09/2026 |
| Syndicat mixte Garonne Amont — eau, prévention des inondations, vie du syndicat | https://sm-garonne-amont.fr/feed/ | Comminges | 03/09/2026 |
| Ville de Tarbes — informations municipales et annonces culturelles | https://www.tarbes.fr/feed/ | Hautes-Pyrénées | 25/09/2026 |
| La Dépêche — Esbareich | https://www.ladepeche.fr/communes/esbareich,65158/rss.xml | Barousse | 18/08/2026 |

Deux lectures locales réussies par flux, titres/liens/dates valides : [rapport détaillé](extra-sources-audit-2026-09-27.json). Sonde sans écriture sur Vercel le 27/09, déploiement `infodrop-d32yhca5i-symposium-s-projects.vercel.app` : `success: true`, 7 contrôlés, 7 réussis, 0 échec, 0 date invalide, durée 1 461 ms. Aucun item H24 au moment de cette sonde : ce n'est pas une panne et aucun contenu ancien n'est redaté pour remplir le fil.

Pour les agendas, la date de publication est conservée, jamais remplacée par la date de l'événement. Vérification de l'annonce municipale « Fête de Sainte-Thérèse » : `pubDate` RSS concorde avec `datePublished` de la page, le 24/09/2026 à 13:43:41 UTC. Les entretiens et l'agenda Radio Présence déjà présents ne sont pas ajoutés une seconde fois.

## Julien Bégué et informations officielles

- La [fiche du Sénat de Maryse Carrère](https://www.senat.fr/senateur/carrere_maryse19629c.html) mentionne Julien Bégué comme collaborateur. La [fiche officielle BANATIC d'Esbareich](https://www.banatic.interieur.gouv.fr/commune/65158-Esbareich) le mentionne comme maire. Vérifications du 27/09/2026.
- La rubrique Esbareich permet de suivre les nouvelles du village ; elle ne garantit pas de capter toutes les mentions du maire. Neste Barousse et la rubrique Saint-Béat-Lez étaient déjà suivies.
- Aucun RSS personnel fiable de Julien Bégué ni flux officiel spécifique à Maryse Carrère trouvé sur les pages consultées. L'activité de la sénatrice ne sera pas attribuée à son collaborateur.
- Les [actes administratifs de la préfecture](https://www.hautes-pyrenees.gouv.fr/Publications/Recueil-d-actes-administratifs) et les [consultations publiques](https://www.hautes-pyrenees.gouv.fr/Publications/Enquetes-publiques-et-consultation-du-Public) sont consultables, mais aucun flux RSS exploitable n'a été trouvé. Non automatisés dans ce lot.
- Les [RSS du Sénat](https://www.senat.fr/flux-rss.html) consultés sont nationaux ou thématiques : non injectés dans Pyrénées faute de rubrique territoriale adaptée. Aucune affirmation de suivi exhaustif des lois ou des élus.

## Autres pistes non ajoutées

- Astronomie : Balcon des étoiles (dernier item RSS 2023), club Les Pléiades (2024), CONTRASTE (2024), Atlas OMP/Pic du Midi (2025, flux général également trop large). Pages parfois actuelles, flux non suffisamment récent : pas d'activation trompeuse.
- Culture : Le Parvis, Chapelle Saint-Jacques, Eth Ostau Comengés — pas de RSS exploitable découvert sur les pages consultées. Fréquence Luz « Sortir » et Tarbes apportent des annonces culturelles sans fabriquer un agenda.
- Vivre en Comminges : un item daté du 07/10/2026 était futur lors du contrôle du 27/09 ; piste non retenue dans ce lot.
- TV : France 3 Hautes-Pyrénées reste active ; aucune nouvelle web-TV locale avec un flux récent validé dans cette recherche.

Le périmètre reste fourni par les rubriques. Aucun scraping périodique, aucune nouvelle tâche planifiée, aucun filtrage géographique ou politique ajouté.
