import { sequelize } from '../config/database.js';
import '../models/index.js'; // Import pour charger tous les modèles et associations
import logger from '../config/logger.js';

async function sync() {
    try {
        logger.info('Connexion à la base de données...');
        await sequelize.authenticate();
        
        logger.info('Début de la synchronisation (alter: true)...');
        await sequelize.sync({ alter: true });
        
        logger.info('Base de données synchronisée avec succès !');
        process.exit(0);
    } catch (error) {
        logger.error('Erreur lors de la synchronisation :', error);
        process.exit(1);
    }
}

sync();
