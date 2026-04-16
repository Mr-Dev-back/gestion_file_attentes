import { sequelize } from '../../src/config/database.js';

async function listQuai() {
    try {
        const [results] = await sequelize.query("SELECT * FROM \"QuaiParameter\"");
        console.log('QuaiParameters:', JSON.stringify(results, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

listQuai();
