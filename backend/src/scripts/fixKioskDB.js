import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';
import Kiosk from '../models/Kiosk.js';

async function fix() {
    try {
        logger.info('--- Synchronisation du modèle Kiosk ---');
        // Alter: true will attempt to add missing columns without losing data
        await Kiosk.sync({ alter: true });
        logger.info('✓ Table Kiosk synchronisée avec succès.');
        process.exit(0);
    } catch (error) {
        logger.error('Erreur lors de la synchronisation:', error);
        process.exit(1);
    }
}

fix();
