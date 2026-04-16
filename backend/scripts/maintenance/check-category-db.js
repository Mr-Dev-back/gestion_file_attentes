import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Category'");
        console.log('Category columns:', results);
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
check();
