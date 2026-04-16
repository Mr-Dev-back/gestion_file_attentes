import { sequelize } from '../../src/config/database.js';

async function updateQuai() {
    try {
        const siteId = '9bc42ad5-a38a-4afc-ba55-e69736bdfc8e';
        const [results] = await sequelize.query(`UPDATE "QuaiParameter" SET "siteId" = '${siteId}' WHERE "siteId" IS NULL`);
        console.log('Updated QuaiParameter entries:', results);
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

updateQuai();
