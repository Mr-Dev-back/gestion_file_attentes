import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres', logging: false });
async function run() {
    try {
        const ticketId = '0fbb599a-aa40-4b50-b9b7-84dda8e2f798';
        const [v] = await s.query(`SELECT * FROM "TicketVehicleInfo" WHERE "ticketId" = '${ticketId}'`);
        const [l] = await s.query(`SELECT * FROM "TicketLogistic" WHERE "ticketId" = '${ticketId}'`);
        const [t] = await s.query(`SELECT "ticketId", "ticketNumber", "licensePlate", "driverName", "companyName", "orderNumber" FROM "Ticket" WHERE "ticketId" = '${ticketId}'`);
        
        console.log('Ticket Main:', t);
        console.log('Vehicle Info:', v);
        console.log('Logistic Info:', l);
    } catch (e) { console.error(e); }
    process.exit(0);
}
run();
