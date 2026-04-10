import { Resource, Action, Permission, sequelize } from './models/index.js';

async function test() {
    try {
        console.log('Testing DB connection...');
        await sequelize.authenticate();
        console.log('✔ Connected.');

        console.log('Checking registered models...');
        console.log('Models in sequelize:', Object.keys(sequelize.models));

        if (!sequelize.models.Resource) {
            console.log('❌ Resource model NOT found in sequelize.models');
        } else {
            console.log('✔ Resource model found.');
        }

        console.log('Attempting sync...');
        const shouldAlter = process.argv.includes('--alter');
        await sequelize.sync({ alter: shouldAlter });
        console.log(`✔ Sync complete (alter: ${shouldAlter}).`);

    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        process.exit(0);
    }
}

test();
