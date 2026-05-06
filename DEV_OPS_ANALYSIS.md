# Rapport d'Analyse DevOps - GesParc SIBM

Ce document présente une analyse détaillée de l'infrastructure, des pipelines CI/CD et des processus de déploiement du projet GesParc.

## 1. Vue d'Ensemble de l'Architecture

Le projet a migré vers une architecture **100% Conteneurisée** (Docker). L'orchestration est gérée par `docker-compose`.

### Composants et Ports
| Service | Image / Technologie | Port Interne | Port Externe (Host) |
| :--- | :--- | :--- | :--- |
| **Frontend** | Nginx (Alpine) + Vite Build | 80 | 3006 |
| **Backend** | Node.js (20-slim) | 3000 | 3003 |
| **FastAPI** | Python (3.11-slim) | 8082 | 8082 |
| **Base de données** | PostgreSQL 15 | 5432 | - |
| **Cache / Queue** | Redis 7 | 6379 | - |

## 2. Pipeline CI/CD (GitHub Actions)

Le fichier `.github/workflows/ci-cd.yml` définit un pipeline robuste :

### Étapes du Pipeline :
1.  **Tests Backend** :
    *   Utilise des services Docker (Postgres/Redis) pour l'environnement de test.
    *   Exécute `npm ci`, `npm run lint` et `npm test`.
    *   Génère un artefact `backend-bundle.tar.gz`.
2.  **Tests Frontend** :
    *   Exécute `npm ci`, `npm run lint` et `npm test`.
    *   Construit le build de production (`npm run build`).
    *   Télécharge le dossier `dist/` comme artefact.
3.  **Déploiement Automatique (Branche `main`)** :
    *   Se connecte via SSH au serveur de production (Port 2112).
    *   Exécute le script `deploy.sh` sur le serveur.
    *   Effectue un **Health Check** après le déploiement.
    *   Envoie des notifications via Discord (Succès/Échec).

## 3. Stratégie de Déploiement

Le script `deploy.sh` est le point d'entrée du déploiement sur le serveur.

### Flux de Déploiement :
1.  `git pull origin main` : Récupération du dernier code.
2.  `docker compose ... up -d --build` : Rebuild des images impactées et redémarrage des services.
3.  `npm run db:migrate` : Exécution des migrations Sequelize à l'intérieur du conteneur backend.
4.  `docker image prune -f` : Nettoyage pour économiser l'espace disque.

## 4. Configuration Nginx (Reverse Proxy)

Il existe deux configurations Nginx dans le projet :
1.  **Conteneur Frontend** : Sert les fichiers statiques React.
2.  **Host Nginx** (`nginx/gfa-sibm-secure.conf`) : Gère le SSL (Let's Encrypt), la sécurité (HSTS, CSP) et redirige le trafic vers les ports Docker (3003, 3006, 8082).

## 5. Sécurité et Maintenance

### Points Forts :
*   Utilisation de Docker pour l'isolation des services.
*   Secrets GitHub pour les informations sensibles (SSH, DB, API Keys).
*   Port SSH non-standard (2112).
*   Health Checks intégrés dans Docker et le pipeline CI/CD.

### Recommandations :
*   **Backups** : Mettre en place des sauvegardes automatiques du volume `postgres_pd_data`.
*   **Monitoring** : Utiliser un outil comme Portainer ou Prometheus pour surveiller les conteneurs.
*   **Nettoyage des logs** : Configurer la rotation des logs Docker pour éviter de saturer le disque.
