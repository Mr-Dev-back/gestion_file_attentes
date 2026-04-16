import { sequelize } from '../src/config/database.js';

async function resetDb() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // Nuke it from orbit. It's the only way to be sure.
        await sequelize.query('DROP SCHEMA public CASCADE;');
        await sequelize.query('CREATE SCHEMA public;');

        console.log('Public schema reset successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Reset failed:', err);
        process.exit(1);
    }
}

resetDb();
