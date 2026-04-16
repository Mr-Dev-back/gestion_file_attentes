import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function migrate() {
    try {
        await s.query('ALTER TABLE "WorkflowStep" RENAME COLUMN "order" TO "stepOrder"');
        console.log('OK: Column renamed');
    } catch (e) {
        console.error('Error (maybe column already renamed):', e.message);
    }
    
    try {
        await s.query('ALTER TABLE "WorkflowStep" ADD COLUMN IF NOT EXISTS "formConfig" JSONB DEFAULT \'[]\'');
        console.log('OK: formConfig column added');
    } catch (e) {
        console.error('Error adding formConfig:', e.message);
    }

    try {
        await s.query('ALTER TABLE "WorkflowStep" ADD COLUMN IF NOT EXISTS "isolationAfterRecalls" SMALLINT DEFAULT 2');
        console.log('OK: isolationAfterRecalls column added');
    } catch (e) {
        console.error('Error adding isolationAfterRecalls:', e.message);
    }
    
    process.exit(0);
}
migrate();
