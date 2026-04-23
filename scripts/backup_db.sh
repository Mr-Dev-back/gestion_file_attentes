#!/bin/bash
# ==============================================================================
# GesParc SIBM - Script de Sauvegarde PostgreSQL
# ==============================================================================
# Ce script crée un dump compressé de la base de données et supprime
# les anciennes sauvegardes pour préserver l'espace disque.
#
# À ajouter dans la crontab (crontab -e) :
# 0 2 * * * /home/ftuser/gfa-sibm/scripts/backup_db.sh >> /var/log/gesparc-backup.log 2>&1
# ==============================================================================

# Variables
BACKUP_DIR="/var/backups/gesparc"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="gesparc"
DB_USER="postgres"
# Note: PGPASSWORD est utilisé par pg_dump de manière non-interactive
export PGPASSWORD="sibmlab@1014"

# Configuration
DAYS_TO_KEEP=7
FILE_NAME="gesparc_backup_${DATE}.sql.gz"
FILE_PATH="${BACKUP_DIR}/${FILE_NAME}"

# Création du dossier si inexistant
mkdir -p "$BACKUP_DIR"

echo "--------------------------------------------------------"
echo "Début de la sauvegarde : $(date +"%Y-%m-%d %H:%M:%S")"
echo "Base de données : $DB_NAME"
echo "Destination     : $FILE_PATH"

# Exécution du dump et compression à la volée
pg_dump -U "$DB_USER" -h 127.0.0.1 -d "$DB_NAME" | gzip > "$FILE_PATH"

# Vérification de l'exécution
if [ $? -eq 0 ]; then
    echo "✅ Succès: Sauvegarde créée avec succès."
    
    # Rotation des logs : suppression des fichiers de plus de 7 jours
    echo "Rotations des sauvegardes de plus de $DAYS_TO_KEEP jours..."
    find "$BACKUP_DIR" -type f -name "gesparc_backup_*.sql.gz" -mtime +$DAYS_TO_KEEP -delete
    echo "✅ Nettoyage terminé."
else
    echo "❌ Erreur: La sauvegarde a échoué."
    # Optionnel: Notifier l'admin via webhook Discord/Slack ici
    exit 1
fi

echo "Fin de la sauvegarde : $(date +"%Y-%m-%d %H:%M:%S")"
echo "--------------------------------------------------------"
