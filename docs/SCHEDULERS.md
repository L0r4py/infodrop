# Planification des collecteurs

| Flux | Scheduler | Endpoint | Fréquence | Authentification | Dernière réussite vérifiée |
| --- | --- | --- | --- | --- | --- |
| National | Cron-Job.org, job `6274142` | `GET /api/parse-rss` | Toutes les 30 min (`*/30 * * * *`, Europe/Paris) | `Authorization: Bearer CRON_SECRET` | 2026-09-27 04:30 CEST, automatique, HTTP 200 |
| Purge 24 h | Cron-Job.org, job `6274097` | `GET /api/daily-purge` | Toutes les 30 min (`*/30 * * * *`, Europe/Paris) | `Authorization: Bearer CRON_SECRET` | 2026-09-27 04:30 CEST, automatique, HTTP 200, 4 lignes expirées supprimées |
| Pyrénées | GitHub Actions, `collect-pyrenees.yml` | `POST /api/parse-local-rss` | Minutes 7, 22, 37 et 52 de chaque heure (UTC) | `Authorization: Bearer CRON_SECRET` via GitHub Actions | 2026-09-27 05:15 CEST, [exécution 36290889414](https://github.com/L0r4py/infodrop/actions/runs/36290889414), 34/34 sources réussies |

Cette séparation est volontaire : Cron-Job.org gère le National et la purge, GitHub Actions gère uniquement Pyrénées. Aucun cron Vercel n’est configuré et aucun endpoint n’est appelé par deux schedulers.

Le workflow Pyrénées valide `success == true`, au moins une source contrôlée, `sources_ok == sources_checked` et `sources_failed == 0`. Il ne suppose aucun nombre fixe de sources.

Le job historique `INFODROP 2 - Parse RSS` reste inactif. Il ne doit pas être réactivé tant que le job National `6274142` assure la collecte.
