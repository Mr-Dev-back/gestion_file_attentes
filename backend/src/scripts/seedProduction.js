import { seedProduction } from '../seeders/productionInitSeeder.js';
import logger from '../config/logger.js';
import { sequelize } from '../config/database.js';

async function run() {
    try {
        await sequelize.authenticate();
        logger.info('Connexion à la base de données réussie.');
        
        await seedProduction();
        
        logger.info('Initialisation de production terminée avec succès.');
        process.exit(0);
    } catch (error) {
        logger.error('Échec de l\'initialisation de production:', error);
        process.exit(1);
    }
}

run();
