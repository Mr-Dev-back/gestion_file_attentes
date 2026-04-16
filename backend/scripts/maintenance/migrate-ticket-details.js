import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres', logging: false });
async function run() {
    try {
        const [tickets] = await s.query(`SELECT "ticketId", "licensePlate", "driverName", "driverPhone", "companyName", "orderNumber" FROM "Ticket"`);
        console.log(`Found ${tickets.length} tickets to sync.`);
        
        for (const t of tickets) {
            // Check if VehicleInfo exists
            const [v] = await s.query(`SELECT 1 FROM "TicketVehicleInfo" WHERE "ticketId" = '${t.ticketId}'`);
            if (v.length === 0) {
                console.log(`Creating VehicleInfo for ${t.ticketNumber || t.ticketId}`);
                await s.query(`
                    INSERT INTO "TicketVehicleInfo" ("ticketId", "licensePlate", "driverName", "driverPhone", "companyName")
                    VALUES ('${t.ticketId}', '${t.licensePlate || '---'}', '${t.driverName || 'Chauffeur'}', ${t.driverPhone ? `'${t.driverPhone}'` : 'NULL'}, ${t.companyName ? `'${t.companyName}'` : 'NULL'})
                `);
            }
            
            // Check if Logistic exists
            const [l] = await s.query(`SELECT 1 FROM "TicketLogistic" WHERE "ticketId" = '${t.ticketId}'`);
            if (l.length === 0) {
                console.log(`Creating Logistic for ${t.ticketNumber || t.ticketId}`);
                await s.query(`
                    INSERT INTO "TicketLogistic" ("ticketId", "orderNumber", "plannedQuantity")
                    VALUES ('${t.ticketId}', ${t.orderNumber ? `'${t.orderNumber}'` : 'NULL'}, 0)
                `);
            }
        }
        console.log('Migration completed.');
    } catch (e) { console.error(e); }
    process.exit(0);
}
run();
