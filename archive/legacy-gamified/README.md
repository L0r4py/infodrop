# INFODROP - Le Club privé de l'actu centralisée

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FL0r4py%2Finfodrop)

**INFODROP** n'est pas un simple agrégateur de news. C'est une plateforme gamifiée conçue comme un club privé, dont la mission est d'aider ses membres à sortir de leurs bulles de filtres médiatiques. En transformant la consommation d'information en une "mission d'intelligence", l'application encourage une vision équilibrée et multi-perspectives de l'actualité.

L'interface est fortement inspirée de l'univers "Clash of Clans" pour une expérience utilisateur engageante et unique.

**Lien vers l'application :** [https://www.infodrop.live](https://www.infodrop.live)

---

## ✨ Fonctionnalités Clés

### 🎮 Gamification au Cœur de l'Expérience
- **Système d'XP et de Niveaux :** Chaque article lu récompense l'utilisateur avec des points d'expérience, lui permettant de monter en niveau.
- **Streak de Lecture Quotidien :** Un compteur de "jours de feu" encourage une consultation régulière et récompense l'assiduité.
- **🏆 Mes Succès :** Un palmarès de plus de 15 succès à débloquer en fonction des actions de l'utilisateur (nombre d'articles lus, streaks, niveaux, etc.).
- **💎 Récompenses Unifiées :** Toutes les récompenses (XP, niveaux, succès) sont présentées via un modal unique et cohérent, avec un effet de flou pour une expérience premium.

### 🎯 Score de Diversité
- Un score sur 100, calculé sur les lectures des dernières 24h.
- Il est basé sur deux piliers : la **variété des orientations politiques** et la **variété des sources médiatiques**.
- La carte de score est visible par défaut et disparaît à 100% pour gratifier l'utilisateur et désencombrer l'interface.

### 🌐 INFODROP 360° : La Révolution de l'Analyse
- Un concept unique d'**infographie interactive** pour analyser les sujets d'actualité complexes.
- **Présentation visuelle** des positions des médias sur un spectre politique.
- **Synthèse par IA** qui identifie les faits établis, les points de divergence et les biais médiatiques.
- Format "accordéon" optimisé pour une lecture agréable sur mobile.
- Utilise une approche **statique** (fichiers HTML par analyse) pour des performances maximales, avec une page hub (`infodrop360.html`) qui liste dynamiquement les sujets disponibles.

### ⚙️ Panel d'Administration
- Interface simple pour les administrateurs permettant de :
  - **Ajouter manuellement** des actualités importantes.
  - **Modifier ou supprimer** des articles existants.
  - **Générer des codes d'invitation** à usage unique.

### 🔐 Système d'Invitation Privé
- L'inscription se fait uniquement via un **code d'invitation**.
- Chaque membre reçoit un code unique à partager, favorisant une communauté de qualité.
- Le système gère la relation parrain/filleul.

---

## 🛠️ Stack Technique

- **Frontend :** HTML, [Tailwind CSS](https://tailwindcss.com/) (via CDN), [Alpine.js](https://alpinejs.dev/)
- **Backend & Base de Données :** [Supabase](https://supabase.com/) (Authentication, Postgres, Database Functions)
- **Hébergement :** [Vercel](https://vercel.com/) (Déploiement statique & Serverless Functions pour l'API sécurisée)

---

## 📂 Structure du Projet

-   **`index.html`**: Application principale (Flux 24H) contenant toute la logique de gamification.
-   **`infodrop360.html`**: Page de présentation qui liste les analyses 360° disponibles.
-   **`/analyses/`**: Dossier contenant les pages HTML statiques pour chaque sujet d'analyse 360°.
-   **`/api/`**: Fonctions Serverless (Node.js) hébergées sur Vercel pour la logique backend.
    -   `config.js`: Sert les clés d'environnement (Supabase) de manière sécurisée.
    -   `check-email.js`, `generate-invite.js`, `validate-invite.js`: Gèrent le système d'invitations.
    -   `parse-rss.js`: Cœur du système d'agrégation des flux d'actualités.
    -   `daily-purge.js`: Tâche planifiée (Cron Job) pour le nettoyage des anciennes données.
-   **`/images/`**: Contient tous les assets visuels : favicons, icônes PWA pour l'écran d'accueil, et l'image de partage social.
-   **`vercel.json`**: Fichier de configuration pour Vercel.
-   **`package.json`**: Définit les dépendances Node.js nécessaires au fonctionnement des fonctions Serverless dans le dossier `/api/`.

---

## 🚀 Améliorations Futures

- **Faire évoluer le Score de Diversité :** Passer du modèle "Bingo" (exploration) à un modèle "Balance" (équilibre), qui pénaliserait une surconsommation d'une seule orientation politique pour un engagement encore plus profond.

---

## 🙏 Remerciements

Un immense merci à nos bêta-testeurs pour leur aide précieuse, leurs retours avisés et leur soutien tout au long du développement.

🛡️ **Alpha4, Coolmax, José, Yoz, Same** 🛡️