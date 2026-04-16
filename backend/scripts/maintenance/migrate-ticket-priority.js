import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function migrate() {
    try {
        await s.query('ALTER TABLE "Ticket" ALTER COLUMN "priority" DROP DEFAULT');
        await s.query('ALTER TABLE "Ticket" ALTER COLUMN "priority" TYPE SMALLINT USING (CASE WHEN priority::text = \'HIGH\' THEN 2 WHEN priority::text = \'NORMAL\' THEN 0 ELSE 1 END)');
        await s.query('ALTER TABLE "Ticket" ALTER COLUMN "priority" SET DEFAULT 0');
        console.log('OK: priority converted to smallint');
    } catch (e) { console.error('priority error:', e.message); }

    process.exit(0);
}
migrate();
