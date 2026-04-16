import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'TicketActionLog' AND is_nullable = 'NO'");
        console.log('TicketActionLog NOT NULL columns:', results);
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
check();
