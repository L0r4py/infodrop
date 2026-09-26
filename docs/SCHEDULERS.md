# Planification des collecteurs

| Flux | Scheduler | Endpoint | Fréquence | Authentification | Dernière réussite vérifiée |
| --- | --- | --- | --- | --- | --- |
| National | Cron-Job.org, job `6274142` | `GET /api/parse-rss` | Toutes les 30 min (`*/30 * * * *`, Europe/Paris) | `Authorization: Bearer CRON_SECRET` | 2026-09-26 23:59 CEST, relance manuelle de validation (`success: true`) |
| Purge 24 h | Cron-Job.org, job `6274097` | `GET /api/daily-purge` | Toutes les 30 min (`*/30 * * * *`, Europe/Paris) | `Authorization: Bearer CRON_SECRET` | 2026-09-26 11:00 CEST, avant l'incident d'authentification |
| Pyrénées | GitHub Actions, `collect-pyrenees.yml` | `POST /api/parse-local-rss` | Minutes 7, 22, 37 et 52 de chaque heure (UTC) | `Authorization: Bearer CRON_SECRET` via GitHub Actions | 2026-09-26 22:06 CEST |

Répartition volontaire : Cron-Job.org gère le National et la purge ; GitHub Actions gère uniquement Pyrénées. Aucun cron Vercel n'est configuré. Le job historique `INFODROP 2 - Parse RSS` reste inactif et ne participe pas à la collecte.

La validation Pyrénées exige une réponse réussie, au moins une source contrôlée, aucune source en échec et `sources_ok == sources_checked`. Elle ne dépend d'aucun nombre de sources codé en dur.
