# Planification des collecteurs

| Flux | Scheduler | Endpoint | Fréquence | Authentification | Dernière réussite vérifiée |
| --- | --- | --- | --- | --- | --- |
| National | Cron-Job.org, job `6274142` | `GET /api/parse-rss` | Toutes les 30 min (`*/30 * * * *`, Europe/Paris) | `Authorization: Bearer CRON_SECRET` | 2026-09-27 15:30 CEST, automatique, HTTP 200 |
| Purge 24 h | Cron-Job.org, job `6274097` | `GET /api/daily-purge` | Toutes les 30 min (`*/30 * * * *`, Europe/Paris) | `Authorization: Bearer CRON_SECRET` | 2026-09-27 15:00 CEST, automatique, HTTP 200 |
| Pyrénées | GitHub Actions, `collect-pyrenees.yml` | `POST /api/parse-local-rss` | Minutes 7, 22, 37 et 52 de chaque heure (UTC), cadence nominale | `Authorization: Bearer CRON_SECRET` via GitHub Actions | 2026-09-27 14:22 CEST, [exécution 36318760363](https://github.com/L0r4py/infodrop/actions/runs/36318760363), 78/78 sources réussies |

Cette séparation est volontaire : Cron-Job.org gère le National et la purge, GitHub Actions gère uniquement Pyrénées. Aucun cron Vercel n’est configuré et aucun endpoint n’est appelé par deux schedulers.

Le workflow Pyrénées valide `success == true`, au moins une source contrôlée, `sources_ok == sources_checked` et `sources_failed == 0`. Il ne suppose aucun nombre fixe de sources.

Le job historique `INFODROP 2 - Parse RSS` reste inactif. Il ne doit pas être réactivé tant que le job National `6274142` assure la collecte.

Attention au délai GitHub Actions : les derniers passages automatiques observés le 27 septembre sont 08:29 puis 14:22 CEST, malgré la cadence configurée de quinze minutes. Le déclenchement régulier à cette cadence n'est donc pas validé. Aucun scheduler de remplacement n'a été ajouté.
