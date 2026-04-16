import { sequelize } from '../../src/config/database.js';

async function listMigrations() {
    try {
        const [results] = await sequelize.query("SELECT name FROM \"SequelizeMeta\"");
        console.log('Applied Migrations:', JSON.stringify(results.map(r => r.name), null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

listMigrations();
