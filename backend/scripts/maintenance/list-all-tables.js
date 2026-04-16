import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query("SELECT table_name, table_schema FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('information_schema', 'pg_catalog')");
        console.log('Tables:', JSON.stringify(results, null, 2));
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
check();
