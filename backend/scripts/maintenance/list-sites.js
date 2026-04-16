import { sequelize } from '../../src/config/database.js';

async function listSites() {
    try {
        const [results] = await sequelize.query("SELECT * FROM \"Site\"");
        console.log('Sites:', JSON.stringify(results, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

listSites();
