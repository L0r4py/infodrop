# Planification des collecteurs

| Flux | Scheduler | Endpoint | Fréquence | Authentification | Dernière réussite vérifiée |
| --- | --- | --- | --- | --- | --- |
| National | Cron-Job.org, job `6274142` | `GET /api/parse-rss` | Toutes les 30 min (`*/30 * * * *`, Europe/Paris) | `Authorization: Bearer CRON_SECRET` | 2026-09-27 15:30 CEST, automatique, HTTP 200 |
| Purge 24 h | Cron-Job.org, job `6274097` | `GET /api/daily-purge` | Toutes les 30 min (`*/30 * * * *`, Europe/Paris) | `Authorization: Bearer CRON_SECRET` | 2026-09-27 15:00 CEST, automatique, HTTP 200 |
| Pyrénées | Cron-Job.org, job `8523882` | `POST /api/parse-local-rss` | Toutes les 15 min (`*/15 * * * *`, Europe/Paris) | `Authorization: Bearer CRON_SECRET` | Test manuel utilisateur le 2026-09-27 à 15:48 CEST : HTTP 200, `success: true`, 78/78 sources, zéro échec, 11,2 s. Passages automatiques à confirmer. |

Cron-Job.org gère désormais toutes les collectes automatiques et la purge. Aucun cron Vercel n'est configuré. La planification GitHub Actions Pyrénées est retirée à la demande de l'utilisateur dès la réussite du test manuel Cron-Job.org, sans attendre les deux passages automatiques de validation, afin d'éviter les doublons.

Le workflow Pyrénées est conservé uniquement pour un déclenchement manuel (`workflow_dispatch`), sans événement `schedule`, `push` ni `pull_request`. Il valide `success == true`, au moins une source contrôlée, `sources_ok == sources_checked` et `sources_failed == 0`. Il ne suppose aucun nombre fixe de sources.

Le job historique `INFODROP 2 - Parse RSS` reste inactif. Il ne doit pas être réactivé tant que le job National `6274142` assure la collecte.

La migration remplace une cadence GitHub Actions nominale de quinze minutes dont les derniers passages observés étaient espacés de plusieurs heures. Le contrôle des premiers passages automatiques Cron-Job.org est maintenu ; aucun nouveau test manuel n'est nécessaire.
