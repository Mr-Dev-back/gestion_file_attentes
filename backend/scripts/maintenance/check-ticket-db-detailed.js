import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query('SELECT * FROM "Ticket" LIMIT 1');
        console.log('Ticket sample row:', results[0] || 'No rows found');
        const [columns] = await s.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Ticket'");
        console.log('Ticket columns:', columns);
    } catch (e) { console.error('Ticket error:', e.message); }
    process.exit(0);
}
check();
