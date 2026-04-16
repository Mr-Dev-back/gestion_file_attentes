import { sequelize } from '../../src/config/database.js';

async function checkColumn() {
    try {
        const [results] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'QuaiParameter' AND column_name = 'siteId'");
        console.log('Column siteId in QuaiParameter:', results.length > 0 ? 'Exists' : 'Missing');
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

checkColumn();
