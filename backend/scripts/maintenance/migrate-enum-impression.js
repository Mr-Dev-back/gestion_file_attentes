import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function migrate() {
    try {
        await s.query("ALTER TYPE \"enum_TicketActionLog_actionType\" ADD VALUE 'IMPRESSION'");
        console.log('OK: IMPRESSION added to actionType enum');
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
migrate();
