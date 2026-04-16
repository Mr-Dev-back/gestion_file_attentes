import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'enum_TicketActionLog_actionType'");
        console.log('TicketActionLog actionType enum values:', results.map(r => r.enumlabel));
    } catch (e) { 
        try {
            // Alternative name if sequelize didn't use the default
            const [results2] = await s.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname LIKE '%actionType%'");
            console.log('ActionType enum values (fuzzy):', results2);
        } catch (e2) {
            console.error('Enum error:', e2.message);
        }
    }
    process.exit(0);
}
check();
