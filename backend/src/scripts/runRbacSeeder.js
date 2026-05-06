import { seedRBAC } from '../seeders/rbacSeeder.js';
import logger from '../config/logger.js';
import { sequelize } from '../config/database.js';

async function run() {
    try {
        await sequelize.authenticate();
        logger.info('Connexion à la base de données réussie.');
        
        await seedRBAC();
        
        logger.info('RBAC Seeding terminé avec succès.');
        process.exit(0);
    } catch (error) {
        logger.error('Échec du seeding RBAC:', error);
        process.exit(1);
    }
}

run();
