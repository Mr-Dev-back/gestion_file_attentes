#!/bin/bash
# ================================================
# Deploy.sh SIGFA - 100% Docker (Version Finale)
# ================================================

set -e  # Arrête le script en cas d'erreur

PROJECT_DIR="/home/adminsibm/gesparc"
ENV_FILE=".env.prod"
COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Déploiement SIGFA - Mode Docker"

# 1. Aller dans le répertoire du projet
cd "$PROJECT_DIR" || { echo "❌ Erreur : Répertoire $PROJECT_DIR introuvable"; exit 1; }

# 2. Mise à jour du code
echo "📥 Pull des dernières modifications..."
git pull origin main || { echo "❌ Erreur git pull"; exit 1; }

# 3. Vérification .env.prod
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Erreur : $ENV_FILE manquant !"
  exit 1
fi

# 4. Build & Démarrage des containers
echo "🏗 Construction et démarrage des services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

# Attendre que le backend ait fini de synchroniser les tables (sync alter: true)
echo "⏳ Attente de l'initialisation du schéma (Sequelize sync)..."
sleep 15

# 5. Migrations et Seeding base de données
echo "🔄 Exécution des migrations complémentaires..."
docker compose -f "$COMPOSE_FILE" exec -T backend npm run db:migrate || echo "⚠️ Attention : Les migrations ont rencontré un problème"

echo "🌱 Injection des données de configuration (Seeding)..."
docker compose -f "$COMPOSE_FILE" exec -T backend npm run seed:prod || echo "⚠️ Attention : Le seeding a échoué"

# 6. Démarrage final (s'assurer que tout est up)
echo "🚢 Finalisation du démarrage des services..."
docker compose -f "$COMPOSE_FILE" up -d backend frontend

# 7. Nettoyage
echo "🧹 Nettoyage des images inutilisées..."
docker image prune -f

echo "✅ Déploiement terminé avec succès !"
echo "   Frontend → http://192.168.11.189:3006"
echo "   Backend  → http://192.168.11.189:3003/api"