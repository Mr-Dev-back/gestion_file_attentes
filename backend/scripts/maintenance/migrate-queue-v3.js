import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function migrate() {
    try {
        await s.query('ALTER TABLE "Queue" RENAME COLUMN "isActive" TO "isActived"');
        console.log('OK: isActive -> isActived');
    } catch (e) { console.error('isActived error:', e.message); }

    process.exit(0);
}
migrate();
