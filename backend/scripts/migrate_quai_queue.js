import { sequelize } from '../src/config/database.js';

async function migrate() {
    try {
        console.log('Ajout de la colonne queueId à la table QuaiParameter...');
        await sequelize.query('ALTER TABLE "QuaiParameter" ADD COLUMN IF NOT EXISTS "queueId" UUID REFERENCES "Queue"("queueId") ON DELETE SET NULL;');
        console.log('Migration terminée avec succès.');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la migration:', error);
        process.exit(1);
    }
}

migrate();
