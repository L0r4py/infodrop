# Vérification des flux Pyrénées — 25 septembre 2026

## Règle d’admission

Un flux n’entre dans le registre actif que s’il réussit deux lectures consécutives avec un délai maximal de 12 secondes et si l’échantillon contrôlé contient, pour chaque article, un titre non vide, une URL HTTP(S) valide et une date exploitable. Le dernier article doit dater de moins de 180 jours et ne pas être publié artificiellement dans le futur.

Cette vérification confirme l’état observé à la date indiquée. La collecte en exploitation conserve ensuite un historique des succès, erreurs et timeouts afin de repérer une dégradation durable.

Contrôle final relancé le 25 septembre 2026 à 22:15 UTC : **38 lectures réussies sur 38**, réponses HTTP 200, aucun timeout et aucun échec de parsing. La même liste a ensuite réussi deux collectes consécutives depuis la preview Vercel : **19/19 puis 19/19**, avec une durée individuelle maximale de 3 034 ms. Certains flux n’avaient naturellement aucun article qualifié dans la fenêtre locale des dernières 24 heures au moment du contrôle ; cela ne remet pas en cause leur validité technique.

## Flux actifs retenus

| Source | Articles contrôlés par passage | Article le plus récent | Résultat |
|---|---:|---:|---|
| Ville de Saint-Gaudens | 6 | 2026-07-31 | 2/2 réussis |
| Cagire Garonne Salat | 10 | 2026-09-25 | 2/2 réussis |
| Communauté de communes Neste Barousse | 10 | 2026-09-22 | 2/2 réussis |
| Communauté de communes du Plateau de Lannemezan | 10 | 2026-09-21 | 2/2 réussis |
| Pyrénées Haut Garonnaises | 15 | 2026-09-25 | 2/2 réussis |
| Ville de Luchon | 20 | 2026-09-10 | 2/2 réussis |
| Département des Hautes-Pyrénées | 10 | 2026-09-15 | 2/2 réussis |
| Conselh Generau d’Aran | 10 | 2026-09-25 | 2/2 réussis |
| Petite République | 10 | 2026-09-25 | 2/2 réussis |
| La Semaine des Pyrénées | 10 | 2026-09-25 | 2/2 réussis |
| La Nouvelle République des Pyrénées | 20 | 2026-09-25 | 3/3 puis 2/2 réussis |
| Parc national des Pyrénées | 10 | 2026-09-17 | 2/2 réussis |
| DREAL Occitanie | 20 | 2026-09-07 | 2/2 réussis |
| liO Occitanie | 9 | 2026-09-22 | 2/2 réussis |
| SDIS 31 | 10 | 2026-09-16 | 2/2 réussis |
| ARS Occitanie | 20 | 2026-09-25 | 2/2 réussis |
| Centre Hospitalier Comminges Pyrénées | 10 | 2026-09-23 | 2/2 réussis |
| Agriculture Pyrénées | 8 | 2026-09-07 | 2/2 réussis |
| La Dépêche | 20 | 2026-09-25 | 2/2 réussis |

Total : **19 flux actifs vérifiés**. Les URL exactes sont dans `public/config/sources-pyrenees.json`.

## Corrections issues du test

- Le flux générique de Saint-Gaudens était ancien ; le flux de la rubrique Actualités a été trouvé et validé.
- Le chemin RSS déclaré par le Parc national des Pyrénées a remplacé une variante non canonique.
- Le flux du SDIS 31 sous `/actualites/` renvoyait 404 ; le flux racine fonctionne et a été retenu.
- Atmo Occitanie répond localement, mais deux collectes Vercel consécutives ont épuisé leurs relances ; la source est conservée inactive et remplacée par La Nouvelle République des Pyrénées.
- Le flux du PNR Comminges Barousse Pyrénées répond mais ne contient aucun article : il reste à investiguer et n’est pas actif.

## Reproduire le contrôle

```text
node scripts/verify-local-sources.mjs
```
