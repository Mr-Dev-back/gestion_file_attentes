import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function run() {
    try {
        const [ticket] = await s.query(`SELECT "ticketId", "siteId", "ticketNumber" FROM "Ticket" WHERE "ticketId" = '0fbb599a-aa40-4b50-b9b7-84dda8e2f798'`);
        const [users] = await s.query(`SELECT "id", "email", "site_id" FROM "users" WHERE "email" LIKE '%admin%'`);
        console.log('Ticket:', ticket);
        console.log('Admin Users:', users);
    } catch (e) { console.error(e); }
    process.exit(0);
}
run();
