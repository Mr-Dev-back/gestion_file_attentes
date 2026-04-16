import { sequelize } from '../src/config/database.js';

async function migrate() {
    try {
        console.log('--- Démarrage de la migration multi-files ---');
        
        // 1. Ajouter queueId à Ticket
        console.log('Ajout de la colonne queueId à la table Ticket...');
        await sequelize.query('ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "queueId" UUID REFERENCES "Queue"("queueId") ON DELETE SET NULL;');

        // 2. Créer la table de jointure WorkflowStepQueue
        console.log('Création de la table WorkflowStepQueue...');
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "WorkflowStepQueue" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "stepId" UUID NOT NULL REFERENCES "WorkflowStep"("stepId") ON DELETE CASCADE,
                "queueId" UUID NOT NULL REFERENCES "Queue"("queueId") ON DELETE CASCADE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                UNIQUE("stepId", "queueId")
            );
        `);

        // 3. (Facultatif) Migrer les données existantes de WorkflowStep vers WorkflowStepQueue
        console.log('Migration des associations existantes...');
        await sequelize.query(`
            INSERT INTO "WorkflowStepQueue" ("stepId", "queueId", "createdAt", "updatedAt")
            SELECT "stepId", "queueId", NOW(), NOW()
            FROM "WorkflowStep"
            WHERE "queueId" IS NOT NULL
            ON CONFLICT DO NOTHING;
        `);

        console.log('--- Migration terminée avec succès ---');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la migration:', error);
        process.exit(1);
    }
}

migrate();
