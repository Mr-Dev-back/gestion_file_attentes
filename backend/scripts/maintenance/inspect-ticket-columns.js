import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Ticket' AND table_schema = 'public'");
        console.log('Ticket Columns:');
        results.forEach(r => console.log(`- ${r.column_name}: ${r.data_type}`));
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
check();
