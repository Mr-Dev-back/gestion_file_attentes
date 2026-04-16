import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function migrate() {
    try {
        await s.query('ALTER TABLE "RefreshToken" ALTER COLUMN "createdAt" DROP NOT NULL');
        await s.query('ALTER TABLE "RefreshToken" ALTER COLUMN "updatedAt" DROP NOT NULL');
        console.log('OK: createdAt and updatedAt are now nullable in RefreshToken');
    } catch (e) { console.error('Error:', e.message); }

    process.exit(0);
}
migrate();
