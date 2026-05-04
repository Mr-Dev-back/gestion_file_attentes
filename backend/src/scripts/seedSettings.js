import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';
import { seedSystemSettings } from '../seeders/systemSettingSeeder.js';

async function run() {
    try {
        logger.info('--- Initialisation des Paramètres Système ---');
        await seedSystemSettings();
        logger.info('✓ Paramètres injectés avec succès.');
        process.exit(0);
    } catch (error) {
        logger.error('Erreur:', error);
        process.exit(1);
    }
}

run();
