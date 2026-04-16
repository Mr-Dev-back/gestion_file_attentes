import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function migrate() {
    try {
        await s.query('ALTER TABLE "Ticket" ALTER COLUMN "currentCategoryIndex" DROP NOT NULL');
        console.log('OK: currentCategoryIndex made nullable');
    } catch (e) { console.error('Error:', e.message); }

    try {
        // If createdAt is NOT NULL, let's make sure it has a default
        await s.query('ALTER TABLE "Ticket" ALTER COLUMN "createdAt" SET DEFAULT NOW()');
        console.log('OK: createdAt default set');
    } catch (e) { console.error('Error:', e.message); }

    try {
        // Just in case, make sure queueId is nullable
        await s.query('ALTER TABLE "Ticket" ALTER COLUMN "queueId" DROP NOT NULL');
        console.log('OK: queueId made nullable');
    } catch (e) { console.error('Error:', e.message); }

    process.exit(0);
}
migrate();
