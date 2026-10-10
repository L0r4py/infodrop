# Sources de l’édition Pyrénées

Mise à jour du 10 octobre 2026 : les rubriques RSS/XML locales gardent leur périmètre et leur zone fixe, sans nouveau filtrage géographique. Exception explicite : la nouvelle veille élargie Actu Toulouse ne remonte que les sujets pertinents pour Comminges, Barousse et Pyrénées, ou ayant un impact régional concret. Dates réelles, fenêtre H24, exclusion des bulletins météo automatiques et déduplication restent applicables.

## Registre

86 flux actifs sur 100 entrées conservées après l'ajout d'Actu Toulouse le 10 octobre 2026. Les sept rubriques radio, institutionnelles et hyperlocales précédentes ont été validées le 27 septembre et activées le 28 septembre 2026. Le lot antérieur comprenait 78 flux actifs : 57 ajouts, remplacement du flux général de La Semaine par sa rubrique Hautes-Pyrénées, 13 désactivations et Atmo toujours inactive. Plusieurs rubriques appartiennent au même média : le nombre de flux n’est pas le nombre de médias H24.

## Veille élargie : Actu Toulouse

- Page : [Actu Toulouse](https://actu.fr/toulouse/) ; flux : [RSS](https://actu.fr/toulouse/rss.xml).
- Deux lectures ciblées le 10 octobre 2026 à 11:06 UTC : HTTP 200, 20/20 titres, liens et dates valides à chaque lecture, 19 items H24 avant filtrage. Ces chiffres sont un relevé, pas une cadence garantie du média.
- Admission opt-in `local-relevance` : communes du Comminges/Barousse, secteurs pyrénéens, axes A64/A645/RN125 et effets régionaux explicites sur les alertes, transports, services publics ou aides.
- Exclus sans lien local ou portée régionale explicite : faits divers purement toulousains, commerces de quartier, métro/Téléo, sorties locales à Toulouse. Un simple tag départemental/régional ne suffit pas.
- Exemple réel du RSS : incendie à Castelbiague (`31114`), admis en Comminges malgré un titre mentionnant seulement Haute-Garonne. Les bulletins météo automatiques restent exclus ; une vigilance orange départementale reste admissible.
- Référentiel communal figé depuis l'[API officielle](https://geo.api.gouv.fr/decoupage-administratif/epcis) : 278 communes de quatre intercommunalités, aucune requête géographique à l'exécution.
- Collecte automatique par le job Pyrénées Cron-Job.org existant, sans scheduler supplémentaire. Aucun autre flux n'a été activé, désactivé ou filtré davantage.

Le détail des sept nouveaux flux, de leurs contrôles et des pistes non retenues figure dans [SOURCES_COMPLEMENTAIRES_2026-09-28.md](SOURCES_COMPLEMENTAIRES_2026-09-28.md).

Les 58 rubriques ajoutées ou remplacées ont réussi deux lectures locales ; résultats détaillés dans [l’audit JSON](local-rubrics-audit-2026-09-27.json). Une sonde Vercel sans écriture précède la mise en production. Les nombres H24 ci-dessous sont ceux du second relevé, avant déduplication entre rubriques.

## Rubriques locales vérifiées

| Commune / secteur | Média | Page locale | RSS/XML | Deux lectures | Articles H24 | Zone |
| --- | --- | --- | --- | --- | ---: | --- |
| Arbas | La Dépêche | [Page](https://www.ladepeche.fr/communes/arbas,31011/) | [RSS](https://www.ladepeche.fr/communes/arbas,31011/rss.xml) | Oui | 1 | comminges |
| Argelès-Gazost | La Dépêche | [Page](https://www.ladepeche.fr/communes/argeles-gazost,65025/) | [RSS](https://www.ladepeche.fr/communes/argeles-gazost,65025/rss.xml) | Oui | 0 | hautes_pyrenees |
| Arreau | La Dépêche | [Page](https://www.ladepeche.fr/communes/arreau,65031/) | [RSS](https://www.ladepeche.fr/communes/arreau,65031/rss.xml) | Oui | 0 | nestes_lannemezan |
| Aspet | La Dépêche | [Page](https://www.ladepeche.fr/communes/aspet,31020/) | [RSS](https://www.ladepeche.fr/communes/aspet,31020/rss.xml) | Oui | 0 | comminges |
| Aurignac | La Dépêche | [Page](https://www.ladepeche.fr/communes/aurignac,31028/) | [RSS](https://www.ladepeche.fr/communes/aurignac,31028/rss.xml) | Oui | 0 | comminges |
| Bagnères-de-Bigorre | La Dépêche | [Page](https://www.ladepeche.fr/communes/bagneres-de-bigorre,65059/) | [RSS](https://www.ladepeche.fr/communes/bagneres-de-bigorre,65059/rss.xml) | Oui | 1 | hautes_pyrenees |
| Bagnères-de-Luchon | La Dépêche | [Page](https://www.ladepeche.fr/communes/bagneres-de-luchon,31042/) | [RSS](https://www.ladepeche.fr/communes/bagneres-de-luchon,31042/rss.xml) | Oui | 0 | luchonnais |
| Barbazan | La Dépêche | [Page](https://www.ladepeche.fr/communes/barbazan,31045/) | [RSS](https://www.ladepeche.fr/communes/barbazan,31045/rss.xml) | Oui | 0 | comminges |
| Boulogne-sur-Gesse | La Dépêche | [Page](https://www.ladepeche.fr/communes/boulogne-sur-gesse,31080/) | [RSS](https://www.ladepeche.fr/communes/boulogne-sur-gesse,31080/rss.xml) | Oui | 0 | comminges |
| Boussens | La Dépêche | [Page](https://www.ladepeche.fr/communes/boussens,31084/) | [RSS](https://www.ladepeche.fr/communes/boussens,31084/rss.xml) | Oui | 0 | comminges |
| Boutx | La Dépêche | [Page](https://www.ladepeche.fr/communes/boutx,31085/) | [RSS](https://www.ladepeche.fr/communes/boutx,31085/rss.xml) | Oui | 0 | luchonnais |
| Capvern | La Dépêche | [Page](https://www.ladepeche.fr/communes/capvern,65127/) | [RSS](https://www.ladepeche.fr/communes/capvern,65127/rss.xml) | Oui | 0 | nestes_lannemezan |
| Cauterets | La Dépêche | [Page](https://www.ladepeche.fr/communes/cauterets,65138/) | [RSS](https://www.ladepeche.fr/communes/cauterets,65138/rss.xml) | Oui | 0 | hautes_pyrenees |
| Cazères | La Dépêche | [Page](https://www.ladepeche.fr/communes/cazeres,31135/) | [RSS](https://www.ladepeche.fr/communes/cazeres,31135/rss.xml) | Oui | 0 | haute_garonne_sud |
| Cierp-Gaud | La Dépêche | [Page](https://www.ladepeche.fr/communes/cierp-gaud,31144/) | [RSS](https://www.ladepeche.fr/communes/cierp-gaud,31144/rss.xml) | Oui | 0 | luchonnais |
| Estancarbon | La Dépêche | [Page](https://www.ladepeche.fr/communes/estancarbon,31175/) | [RSS](https://www.ladepeche.fr/communes/estancarbon,31175/rss.xml) | Oui | 0 | comminges |
| Fos | La Dépêche | [Page](https://www.ladepeche.fr/communes/fos,31190/) | [RSS](https://www.ladepeche.fr/communes/fos,31190/rss.xml) | Oui | 0 | luchonnais |
| Gourdan-Polignan | La Dépêche | [Page](https://www.ladepeche.fr/communes/gourdan-polignan,31224/) | [RSS](https://www.ladepeche.fr/communes/gourdan-polignan,31224/rss.xml) | Oui | 0 | comminges |
| L’Isle-en-Dodon | La Dépêche | [Page](https://www.ladepeche.fr/communes/lisle-en-dodon,31239/) | [RSS](https://www.ladepeche.fr/communes/lisle-en-dodon,31239/rss.xml) | Oui | 0 | comminges |
| La Barthe-de-Neste | La Dépêche | [Page](https://www.ladepeche.fr/communes/la-barthe-de-neste,65069/) | [RSS](https://www.ladepeche.fr/communes/la-barthe-de-neste,65069/rss.xml) | Oui | 0 | nestes_lannemezan |
| Labarthe-Inard | La Dépêche | [Page](https://www.ladepeche.fr/communes/labarthe-inard,31246/) | [RSS](https://www.ladepeche.fr/communes/labarthe-inard,31246/rss.xml) | Oui | 0 | comminges |
| Labarthe-Rivière | La Dépêche | [Page](https://www.ladepeche.fr/communes/labarthe-riviere,31247/) | [RSS](https://www.ladepeche.fr/communes/labarthe-riviere,31247/rss.xml) | Oui | 0 | comminges |
| Landorthe | La Dépêche | [Page](https://www.ladepeche.fr/communes/landorthe,31270/) | [RSS](https://www.ladepeche.fr/communes/landorthe,31270/rss.xml) | Oui | 0 | comminges |
| Lannemezan | La Dépêche | [Page](https://www.ladepeche.fr/communes/lannemezan,65258/) | [RSS](https://www.ladepeche.fr/communes/lannemezan,65258/rss.xml) | Oui | 4 | nestes_lannemezan |
| Le Fousseret | La Dépêche | [Page](https://www.ladepeche.fr/communes/le-fousseret,31193/) | [RSS](https://www.ladepeche.fr/communes/le-fousseret,31193/rss.xml) | Oui | 0 | haute_garonne_sud |
| Lourdes | La Dépêche | [Page](https://www.ladepeche.fr/communes/lourdes,65286/) | [RSS](https://www.ladepeche.fr/communes/lourdes,65286/rss.xml) | Oui | 16 | hautes_pyrenees |
| Loures-Barousse | La Dépêche | [Page](https://www.ladepeche.fr/communes/loures-barousse,65287/) | [RSS](https://www.ladepeche.fr/communes/loures-barousse,65287/rss.xml) | Oui | 0 | barousse |
| Luz-Saint-Sauveur | La Dépêche | [Page](https://www.ladepeche.fr/communes/luz-saint-sauveur,65295/) | [RSS](https://www.ladepeche.fr/communes/luz-saint-sauveur,65295/rss.xml) | Oui | 0 | hautes_pyrenees |
| Mane | La Dépêche | [Page](https://www.ladepeche.fr/communes/mane,31315/) | [RSS](https://www.ladepeche.fr/communes/mane,31315/rss.xml) | Oui | 0 | comminges |
| Marignac | La Dépêche | [Page](https://www.ladepeche.fr/communes/marignac,31316/) | [RSS](https://www.ladepeche.fr/communes/marignac,31316/rss.xml) | Oui | 0 | luchonnais |
| Mauléon-Barousse | La Dépêche | [Page](https://www.ladepeche.fr/communes/mauleon-barousse,65305/) | [RSS](https://www.ladepeche.fr/communes/mauleon-barousse,65305/rss.xml) | Oui | 0 | barousse |
| Mazères-sur-Salat | La Dépêche | [Page](https://www.ladepeche.fr/communes/mazeres-sur-salat,31336/) | [RSS](https://www.ladepeche.fr/communes/mazeres-sur-salat,31336/rss.xml) | Oui | 0 | comminges |
| Melles | La Dépêche | [Page](https://www.ladepeche.fr/communes/melles,31337/) | [RSS](https://www.ladepeche.fr/communes/melles,31337/rss.xml) | Oui | 0 | luchonnais |
| Montréjeau | La Dépêche | [Page](https://www.ladepeche.fr/communes/montrejeau,31390/) | [RSS](https://www.ladepeche.fr/communes/montrejeau,31390/rss.xml) | Oui | 0 | comminges |
| Pointis-Inard | La Dépêche | [Page](https://www.ladepeche.fr/communes/pointis-inard,31427/) | [RSS](https://www.ladepeche.fr/communes/pointis-inard,31427/rss.xml) | Oui | 0 | comminges |
| Roquefort-sur-Garonne | La Dépêche | [Page](https://www.ladepeche.fr/communes/roquefort-sur-garonne,31457/) | [RSS](https://www.ladepeche.fr/communes/roquefort-sur-garonne,31457/rss.xml) | Oui | 0 | comminges |
| Saint-Aventin | La Dépêche | [Page](https://www.ladepeche.fr/communes/saint-aventin,31470/) | [RSS](https://www.ladepeche.fr/communes/saint-aventin,31470/rss.xml) | Oui | 0 | luchonnais |
| Saint-Béat-Lez | La Dépêche | [Page](https://www.ladepeche.fr/communes/saint-beat,31471/) | [RSS](https://www.ladepeche.fr/communes/saint-beat-lez/rss.xml) | Oui | 0 | luchonnais |
| Saint-Bertrand-de-Comminges | La Dépêche | [Page](https://www.ladepeche.fr/communes/saint-bertrand-de-comminges,31472/) | [RSS](https://www.ladepeche.fr/communes/saint-bertrand-de-comminges,31472/rss.xml) | Oui | 0 | comminges |
| Saint-Gaudens | La Dépêche | [Page](https://www.ladepeche.fr/communes/saint-gaudens,31483/) | [RSS](https://www.ladepeche.fr/communes/saint-gaudens,31483/rss.xml) | Oui | 4 | comminges |
| Saint-Lary-Soulan | La Dépêche | [Page](https://www.ladepeche.fr/communes/saint-lary-soulan,65388/) | [RSS](https://www.ladepeche.fr/communes/saint-lary-soulan,65388/rss.xml) | Oui | 0 | nestes_lannemezan |
| Saint-Laurent-de-Neste | La Dépêche | [Page](https://www.ladepeche.fr/communes/saint-laurent-de-neste,65389/) | [RSS](https://www.ladepeche.fr/communes/saint-laurent-de-neste,65389/rss.xml) | Oui | 0 | nestes_lannemezan |
| Saint-Mamet | La Dépêche | [Page](https://www.ladepeche.fr/communes/saint-mamet,31500/) | [RSS](https://www.ladepeche.fr/communes/saint-mamet,31500/rss.xml) | Oui | 0 | luchonnais |
| Saint-Martory | La Dépêche | [Page](https://www.ladepeche.fr/communes/saint-martory,31503/) | [RSS](https://www.ladepeche.fr/communes/saint-martory,31503/rss.xml) | Oui | 0 | comminges |
| Salies-du-Salat | La Dépêche | [Page](https://www.ladepeche.fr/communes/salies-du-salat,31523/) | [RSS](https://www.ladepeche.fr/communes/salies-du-salat,31523/rss.xml) | Oui | 0 | comminges |
| Sarp | La Dépêche | [Page](https://www.ladepeche.fr/communes/sarp,65407/) | [RSS](https://www.ladepeche.fr/communes/sarp,65407/rss.xml) | Oui | 0 | barousse |
| Sengouagnet | La Dépêche | [Page](https://www.ladepeche.fr/communes/sengouagnet,31544/) | [RSS](https://www.ladepeche.fr/communes/sengouagnet,31544/rss.xml) | Oui | 0 | comminges |
| Tarbes | La Dépêche | [Page](https://www.ladepeche.fr/communes/tarbes,65440/) | [RSS](https://www.ladepeche.fr/communes/tarbes,65440/rss.xml) | Oui | 6 | hautes_pyrenees |
| Valentine | La Dépêche | [Page](https://www.ladepeche.fr/communes/valentine,31565/) | [RSS](https://www.ladepeche.fr/communes/valentine,31565/rss.xml) | Oui | 0 | comminges |
| Villeneuve-de-Rivière | La Dépêche | [Page](https://www.ladepeche.fr/communes/villeneuve-de-riviere,31585/) | [RSS](https://www.ladepeche.fr/communes/villeneuve-de-riviere,31585/rss.xml) | Oui | 0 | comminges |
| Cagire Garonne Salat | Petite République | [Page](https://www.petiterepublique.com/actualites/communautes-de-communes/cc-cagire-garonne-salat/) | [RSS](https://www.petiterepublique.com/actualites/communautes-de-communes/cc-cagire-garonne-salat/feed/) | Oui | 0 | comminges |
| Cœur de Garonne | Petite République | [Page](https://www.petiterepublique.com/actualites/communautes-de-communes/cc-coeur-de-garonne/) | [RSS](https://www.petiterepublique.com/actualites/communautes-de-communes/cc-coeur-de-garonne/feed/) | Oui | 4 | haute_garonne_sud |
| Cœur et Coteaux Comminges | Petite République | [Page](https://www.petiterepublique.com/actualites/communautes-de-communes/cc-coeur-et-coteaux-du-comminges/) | [RSS](https://www.petiterepublique.com/actualites/communautes-de-communes/cc-coeur-et-coteaux-du-comminges/feed/) | Oui | 3 | comminges |
| Pyrénées Haut Garonnaises | Petite République | [Page](https://www.petiterepublique.com/actualites/communautes-de-communes/cc-pyrenees-haut-garonnaises/) | [RSS](https://www.petiterepublique.com/actualites/communautes-de-communes/cc-pyrenees-haut-garonnaises/feed/) | Oui | 0 | luchonnais |
| Hautes-Pyrénées | La Semaine des Pyrénées | [Page](https://www.lasemainedespyrenees.fr/category/hautes-pyrenees/) | [RSS](https://www.lasemainedespyrenees.fr/category/hautes-pyrenees/feed/) | Oui | 10 | hautes_pyrenees |
| Lannemezan pays | La Semaine des Pyrénées | [Page](https://www.lasemainedespyrenees.fr/category/communes/lannemezan-pays/) | [RSS](https://www.lasemainedespyrenees.fr/category/communes/lannemezan-pays/feed/) | Oui | 0 | nestes_lannemezan |
| Lourdes et Gaves | La Semaine des Pyrénées | [Page](https://www.lasemainedespyrenees.fr/category/communes/lourdes-et-gaves/) | [RSS](https://www.lasemainedespyrenees.fr/category/communes/lourdes-et-gaves/feed/) | Oui | 9 | hautes_pyrenees |
| Tarbes agglo | La Semaine des Pyrénées | [Page](https://www.lasemainedespyrenees.fr/category/communes/tarbes-agglo/) | [RSS](https://www.lasemainedespyrenees.fr/category/communes/tarbes-agglo/feed/) | Oui | 5 | hautes_pyrenees |

Le Val d’Aran (Vielha, Bossòst, Naut Aran, Salardú, Arties) conserve le [flux officiel du Conselh Generau](https://www.conselharan.org/category/noticies/feed/), zone `val_aran` : il couvre le secteur dans son ensemble, sans attribution artificielle à une commune.

La [Gazette du Comminges](https://www.ladepeche.fr/la-gazette-du-comminges/rss.xml), la [NRP](https://www.nrpyrenees.fr/rss.xml), [France 3 Hautes-Pyrénées](https://france3-regions.franceinfo.fr/occitanie/hautes-pyrenees/rss) et [Le Petit Journal Hautes-Pyrénées](https://www.lepetitjournal.net/65-hautes-pyrenees/feed/) restent actifs. Les flux institutionnels et hyperlocaux déjà validés sont conservés.

## Désactivations

| Flux | RSS conservé dans le registre | Motif |
| --- | --- | --- |
| Petite République | [RSS](https://www.petiterepublique.com/feed/) | Couverture trop large pour admission intégrale |
| Parc national des Pyrénées | [RSS](https://www.pyrenees-parcnational.fr/fr/flux/rss.xml) | Couverture trop large pour admission intégrale |
| DREAL Occitanie | [RSS](https://www.occitanie.developpement-durable.gouv.fr/spip.php?page=backend-actu) | Couverture trop large pour admission intégrale |
| liO Occitanie | [RSS](https://www.lio-occitanie.fr/feed/) | Couverture trop large pour admission intégrale |
| SDIS 31 | [RSS](https://www.sdis31.fr/feed/) | Couverture trop large pour admission intégrale |
| ARS Occitanie | [RSS](https://www.occitanie.ars.sante.fr/rss.xml) | Couverture trop large pour admission intégrale |
| Agriculture Pyrénées | [RSS](https://agriculturepyrenees.fr/feed/) | Couverture trop large pour admission intégrale |
| La Dépêche | [RSS](https://www.ladepeche.fr/rss.xml) | Couverture trop large pour admission intégrale |
| France 3 Haute-Garonne | [RSS](https://france3-regions.franceinfo.fr/occitanie/haute-garonne/rss) | Couverture trop large pour admission intégrale |
| ICI Occitanie | [RSS](https://www.ici.fr/rss/toulouse/rubrique/infos.xml) | Couverture trop large pour admission intégrale |
| ICI Béarn Bigorre | [RSS](https://www.ici.fr/rss/bearn/rubrique/infos.xml) | Couverture trop large pour admission intégrale |
| Espace Presse Haute-Garonne | [RSS](https://espace-presse.haute-garonne.fr/feed/) | Couverture trop large pour admission intégrale |
| CEN Occitanie | [RSS](https://www.cen-occitanie.org/feed/) | Couverture trop large pour admission intégrale |

Atmo reste inactive (délai serveur observé lors de l’audit précédent). Les entrées désactivées restent consultables ; les anciennes lignes ne sont pas supprimées en masse et expirent via la purge historique.

## Pistes non activées

- ICI : la [liste officielle des RSS](https://www.ici.fr/rss) propose des flux d’antenne. La [page Hautes-Pyrénées](https://www.ici.fr/occitanie/hautes-pyrenees-65) ne déclare pas de flux départemental ; Béarn et Toulouse sont trop larges.
- France 3 Haute-Garonne : département entier, pas seulement le sud. La page Comminges testée retourne 404 ; aucune nouvelle rubrique RSS locale suffisamment précise n’a été validée. Le flux Hautes-Pyrénées reste actif.
- [Le Petit Journal Comminges](https://www.lepetitjournal.net/31c-comminges/feed/) : HTTP 200 mais seulement 6 items sur 10 ont une date exploitable dans le contrôle. Non activé tant que la validation complète échoue.
- Les refus antérieurs (Cœur & Coteaux : dates, SDIS65 et Hôpitaux Lannemezan : ancienneté, PNR : vide, Région : erreur, Vigicrues générique : périmètre) restent documentés dans l’historique.

## Diagnostic

« Sources actives H24 » utilise les volumes réels en base. « Toutes les sources » montre zone, statut, dernier contrôle, dernier item RSS, date du dernier article écrit, dernière écriture, items H24, dates invalides, doublons et lignes écrites. Un flux sain sans article H24 n’est pas une panne. Le compteur territorial historique est désormais alimenté uniquement pour les flux de veille élargie, et reste nul pour les rubriques locales.

### Vérification ciblée du 10 octobre 2026

Le passage Cron-Job.org de 13:30:53 CEST a contrôlé 86 flux : 83 réussites et trois erreurs isolées, sans blocage des autres sources. Le dernier article en base était publié à 12:18 CEST ; le RSS de La Semaine des Pyrénées ne proposait rien de plus récent au contrôle. Les dates affichées restent les dates de publication, pas celles de la collecte.

- Bigorre.org : le RSS `/rss.xml`, toujours déclaré sur sa page d'accueil, retourne HTTP 404 aussi dans Chrome. Dernière lecture réussie : 8 octobre, 20:01 CEST. Aucun flux de remplacement vérifié ; source conservée active.
- Le Petit Journal Hautes-Pyrénées : HTTP 403 avec page de protection Cloudflare. Dernière lecture réussie : 29 septembre, 09:01 CEST. Une autorisation du RSS côté éditeur est nécessaire ; aucune tentative de contournement.
- Ville de Tarbes : HTTP 503 depuis Vercel, alors que le même RSS répond HTTP 200 depuis le poste local. Dernière réussite en production : 10 octobre, 11:15 CEST. Incident intermittent ou restriction d'hébergement à confirmer ; le dernier article RSS date du 9 octobre, 14:57 CEST.

Correctif côté affichage : les rafraîchissements Pyrénées relisent les 50 derniers articles H24 et les fusionnent par identifiant avec les cartes déjà chargées. Un article reçu tard n'est plus ignoré parce que sa publication précède le premier article affiché. Ni les dates stockées, ni les sources, ni la collecte, ni le rafraîchissement National ne sont modifiés.
