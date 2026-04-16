import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Site'");
        console.log('Site columns (exact):', results.map(r => r.column_name));
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
check();
