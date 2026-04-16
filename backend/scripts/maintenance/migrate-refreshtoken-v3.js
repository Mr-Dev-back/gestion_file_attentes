import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function migrate() {
    try {
        await s.query('ALTER TABLE "RefreshToken" RENAME COLUMN "refreshTokenId" TO "id"');
        console.log('OK: refreshTokenId -> id');
    } catch (e) { console.error('id error:', e.message); }

    try {
        await s.query('ALTER TABLE "RefreshToken" RENAME COLUMN "revoked" TO "isRevoked"');
        console.log('OK: revoked -> isRevoked');
    } catch (e) { console.error('isRevoked error:', e.message); }

    process.exit(0);
}
migrate();
