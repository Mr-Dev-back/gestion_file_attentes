import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'enum_Ticket_status'");
        console.log('Ticket status enum values:', results.map(r => r.enumlabel));
    } catch (e) { 
        try {
            const [results2] = await s.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname LIKE '%status%'");
            console.log('Status enum values (fuzzy):', results2);
        } catch (e2) {
            console.error('Enum error:', e2.message);
        }
    }
    process.exit(0);
}
check();
