# Planification des collecteurs

| Flux | Scheduler | Endpoint | Fréquence | Authentification | Dernière réussite vérifiée |
| --- | --- | --- | --- | --- | --- |
| National | Cron-Job.org, job `6274142` | `GET /api/parse-rss` | Toutes les 30 min (`*/30 * * * *`, Europe/Paris) | `Authorization: Bearer CRON_SECRET` | 2026-09-27 15:30 CEST, automatique, HTTP 200 |
| Purge 24 h | Cron-Job.org, job `6274097` | `GET /api/daily-purge` | Toutes les 30 min (`*/30 * * * *`, Europe/Paris) | `Authorization: Bearer CRON_SECRET` | 2026-09-27 15:00 CEST, automatique, HTTP 200 |
| Pyrénées | Cron-Job.org, job `8523882` | `POST /api/parse-local-rss` | Toutes les 15 min (`*/15 * * * *`, Europe/Paris) | `Authorization: Bearer CRON_SECRET` | 2026-09-27 20:45:24 CEST : automatique, HTTP 200, `success: true`, 78/78 sources, zéro échec |

Cron-Job.org gère désormais toutes les collectes automatiques et la purge. Aucun cron Vercel n'est configuré. La planification GitHub Actions Pyrénées est retirée à la demande de l'utilisateur dès la réussite du test manuel Cron-Job.org, sans attendre les deux passages automatiques de validation, afin d'éviter les doublons.

Le workflow Pyrénées est conservé uniquement pour un déclenchement manuel (`workflow_dispatch`), sans événement `schedule`, `push` ni `pull_request`. Il valide `success == true`, au moins une source contrôlée, `sources_ok == sources_checked` et `sources_failed == 0`. Il ne suppose aucun nombre fixe de sources.

Le job historique `INFODROP 2 - Parse RSS` reste inactif. Il ne doit pas être réactivé tant que le job National `6274142` assure la collecte.

La migration remplace une cadence GitHub Actions nominale de quinze minutes dont les derniers passages observés étaient espacés de plusieurs heures. Validation Cron-Job.org achevée le 27 septembre : vingt passages automatiques consécutifs de 16:00 à 20:45 CEST, tous HTTP 200, sans créneau manquant.

Les réponses applicatives des deux derniers passages ont été ouvertes et contrôlées :

| Exécution réelle (CEST) | Durée Cron-Job.org | Résultat JSON |
| --- | --- | --- |
| 20:30:40 | 9,54 s | `success: true`, 78 contrôlées, 78 réussies, 0 échec, 102 articles retenus |
| 20:45:24 | 9,67 s | `success: true`, 78 contrôlées, 78 réussies, 0 échec, 102 articles retenus |

Chaque passage démarre avec quelques dizaines de secondes de décalage par rapport au quart d'heure prévu. Le workflow distant GitHub a été revérifié : `workflow_dispatch` uniquement ; sa dernière exécution planifiée reste celle de 14:22 CEST. Aucun appel manuel supplémentaire n'a été déclenché pour cette validation. Preuve locale : `output/playwright/pyrenees-cron-automatic-success.png`.
