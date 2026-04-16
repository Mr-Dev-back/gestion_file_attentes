import { sequelize } from '../../src/config/database.js';

async function checkData() {
    try {
        const [results] = await sequelize.query("SELECT count(*) as count FROM \"QuaiParameter\"");
        console.log('Number of rows in QuaiParameter:', results[0].count);
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

checkData();
