import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'TicketActionLog'");
        console.log('TicketActionLog locations:', results);
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
check();
