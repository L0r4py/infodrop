# Vérification des compléments Pyrénées — 26 septembre 2026

## Résultat local ciblé

Le lot `config/source-candidates-pyrenees.json` a été lu deux fois avec le parseur réel Infodrop. Cette vérification n’a écrit aucune donnée dans Supabase et n’a activé aucune source.

- 22 endpoints contrôlés ;
- 18 endpoints réussis sur deux lectures consécutives ;
- 4 endpoints écartés avec une cause explicite ;
- contrôle Vercel encore requis avant toute promotion vers `active: true`.

## Contrôle ciblé des deux faux zéros signalés

Après application de la politique source-aware, les deux sources citées par l’audit ont été relues deux fois, sans relancer tout le registre :

| Source | Items bruts | Items H24 | Rejets territoire | Items qualifiés avant déduplication |
|---|---:|---:|---:|---:|
| La Semaine des Pyrénées | 10 | 10 | 0 | 10 |
| La Dépêche — général | 100 | 85 | 77 | 8 |

La Semaine des Pyrénées n’est donc plus artificiellement vidée par un mot-clé communal. Le flux général La Dépêche reste strictement filtré : huit contenus sur 85 items H24 étaient réellement rattachés au périmètre lors du contrôle.

## Candidats ayant réussi les deux lectures locales

| Source | Résultat local | Étape suivante |
|---|---:|---|
| CC Neste-Barousse — Actualités | 2/2 | Tester depuis Vercel, puis remplacer le feed général si le contenu reste équivalent. |
| Conselh Generau d’Aran — Notícies | 2/2 | Tester depuis Vercel, puis remplacer le feed général si le contenu reste équivalent. |
| La Gazette du Comminges | 2/2 | Tester depuis Vercel ; priorité supérieure au flux général La Dépêche. |
| France 3 Haute-Garonne | 2/2 | Tester depuis Vercel ; conserver le filtrage strict sud 31. |
| France 3 Hautes-Pyrénées | 2/2 | Tester depuis Vercel ; politique départementale 65. |
| ICI Occitanie — Actualités | 2/2 | Tester depuis Vercel ; conserver le filtrage strict sud 31. |
| ICI Béarn Bigorre — Actualités | 2/2 | Tester depuis Vercel ; ne retenir que les sujets 65 ou explicitement locaux. |
| Le Petit Journal — Hautes-Pyrénées | 2/2 | Tester depuis Vercel ; feed géographique prioritaire. |
| Bigorre.org | 2/2 | Tester depuis Vercel. |
| Vigicrues — Territoire | 2/2 | Tester depuis Vercel et confirmer le paramétrage territorial avant activation. |
| Sudline | 2/2 | Tester depuis Vercel. |
| Radio Présence — Comminges Interviews | 2/2 | Tester depuis Vercel. |
| Radio Présence — Infos et agenda local | 2/2 | Tester depuis Vercel et vérifier le chevauchement éditorial. |
| PETR Pays Comminges Pyrénées | 2/2 | Tester depuis Vercel. |
| PETR Pays des Nestes | 2/2 | Tester depuis Vercel. |
| Office de tourisme Neste-Barousse | 2/2 | Tester depuis Vercel ; confirmer la valeur éditoriale du contenu avant activation. |
| Espace Presse Département 31 | 2/2 | Tester depuis Vercel ; conserver le filtrage strict sud 31. |
| CEN Occitanie | 2/2 | Tester depuis Vercel ; conserver le filtrage géographique strict. |

Les flux France 3 ont nécessité la normalisation des catégories RSS structurées. Après ce correctif ciblé, les deux endpoints ont réussi 2/2 lectures. Au moment du contrôle, France 3 Haute-Garonne avait quatre items H24, tous hors du sud 31, tandis que France 3 Hautes-Pyrénées avait trois items H24 qualifiés. Ce contraste confirme l’intérêt des compteurs séparés.

## Candidats non promouvables

| Source | Cause constatée sur les deux lectures |
|---|---|
| Le Petit Journal — Comminges | 4 dates invalides sur 10 items. |
| Cœur & Coteaux — Actualités | 1 item sans date sur 14. |
| Cœur & Coteaux — Agenda | dates d’événements futures utilisées comme dates de publication ; incompatible avec la fenêtre H24 sans adaptateur. |
| SDIS 65 | dernier item âgé de 214 jours au moment du contrôle. |

Ces quatre endpoints restent documentés mais ne doivent pas être activés tels quels.

## Garde-fou Vercel

Le collecteur accepte désormais un contrôle unitaire autorisé, sans écriture en base :

```text
POST /api/parse-local-rss?candidate=<slug>
Authorization: Bearer <CRON_SECRET>
```

La réponse expose la qualité du feed et les compteurs de diagnostic. Une source n’est promue dans le registre actif qu’après réussite de ce contrôle depuis l’environnement Vercel. Le lot local se relance avec :

```bash
node scripts/verify-local-sources.mjs --candidates
```
