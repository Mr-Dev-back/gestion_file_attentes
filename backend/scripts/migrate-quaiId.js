import { sequelize } from '../config/database.js';

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('[Migration] Connected to DB.');

        // Add quaiId column if it doesn't exist
        await sequelize.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'Ticket' AND column_name = 'quaiId'
                ) THEN
                    ALTER TABLE "Ticket" ADD COLUMN "quaiId" UUID;
                    RAISE NOTICE 'Column quaiId added to Ticket.';
                ELSE
                    RAISE NOTICE 'Column quaiId already exists.';
                END IF;
            END $$;
        `);

        // Add CALLING to enum if not exists
        await sequelize.query(`ALTER TYPE "enum_Ticket_status" ADD VALUE IF NOT EXISTS 'CALLING';`);
        console.log('[Migration] Added CALLING to enum (if needed).');
        
        // Add PROCESSING to enum if not exists
        await sequelize.query(`ALTER TYPE "enum_Ticket_status" ADD VALUE IF NOT EXISTS 'PROCESSING';`);
        console.log('[Migration] Added PROCESSING to enum (if needed).');

        console.log('[Migration] Done!');
        process.exit(0);
    } catch (err) {
        console.error('[Migration] Error:', err.message);
        process.exit(1);
    }
}

migrate();
