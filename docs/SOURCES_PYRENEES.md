# Sources de l’édition Pyrénées

Registre contrôlé le 27 septembre 2026. Sa version opérationnelle se trouve dans `public/config/sources-pyrenees.json`.

## État du registre

- 35 sources documentées ;
- 34 flux RSS actifs ;
- 19 flux historiques conservés ;
- 15 nouveaux flux validés deux fois localement puis une fois depuis Vercel ;
- 1 source inactive : Atmo Occitanie, conservée pour investigation ;
- délai maximal de 12 secondes par tentative, avec une seconde tentative en cas d’échec ;
- titres, liens, dates et absence de date artificielle contrôlés.

Les 15 ajouts validés sont : La Gazette du Comminges, France 3 Haute-Garonne, France 3 Hautes-Pyrénées, ICI Occitanie, ICI Béarn Bigorre, Le Petit Journal Hautes-Pyrénées, Bigorre.org, Sudline, les deux flux locaux Radio Présence, les PETR Comminges Pyrénées et Pays des Nestes, l’Office de tourisme Neste-Barousse, l’Espace Presse Haute-Garonne et le CEN Occitanie.

## Validation d’un nouveau flux

Une source passe en `active: true` seulement si :

1. l’éditeur, la page d’origine, le type de source et le périmètre sont identifiés ;
2. le flux réussit deux téléchargements et parsings locaux consécutifs ;
3. les items exposent des titres, liens et dates valides ;
4. aucune date absente n’est remplacée par l’heure de collecte ;
5. le flux réussit une sonde sans écriture depuis l’environnement Vercel ;
6. la portée territoriale et le besoin éventuel d’un mot-clé sont explicites.

Les flux écartés lors de cette passe restent inactifs : Le Petit Journal Comminges (dates manquantes), Cœur & Coteaux Comminges (date manquante ou dates d’événements futures), SDIS 65 et Hôpitaux de Lannemezan (flux périmés), PNR Comminges Barousse Pyrénées (flux vide), Région Occitanie (HTTP 500) et Vigicrues générique (pas assez ciblé territorialement). Ils ne sont pas activés pour augmenter artificiellement le compteur.

## Filtrage selon le type de source

- `hyperlocal` et `cross_border` : le périmètre éditorial de la source suffit ;
- `department_65` : les sujets départementaux des Hautes-Pyrénées sont admis sans exiger une commune dans chaque titre ;
- `south_31` : seuls les contenus mentionnant le sud de la Haute-Garonne ou un impact territorial explicite sont retenus, sauf lorsqu’un flux est lui-même limité au Comminges ;
- `regional_strict` et `specialized_strict` : un lieu, un axe, un massif ou un impact du périmètre doit être présent.

## Diagnostic par collecte

Chaque source enregistre le statut, la durée, les items bruts, les items des dernières 24 heures, les rejets territoriaux, les dates invalides, les doublons, les lignes écrites, la date du dernier item du flux et celle du dernier item qualifié. Une source peut donc répondre correctement tout en produisant zéro article pertinent, sans être confondue avec une panne.

Le fichier `docs/source-candidates-2026-09-27.json` conserve les URL examinées. Les rapports plus anciens restent disponibles pour l’historique, mais ne décrivent pas le registre actif actuel.
