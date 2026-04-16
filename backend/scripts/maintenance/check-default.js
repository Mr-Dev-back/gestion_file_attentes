import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'RefreshToken' AND column_name = 'isRevoked'");
        console.log('isRevoked default:', results);
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
check();
