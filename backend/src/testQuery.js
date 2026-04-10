import { Permission, sequelize } from './models/index.js';

async function testQuery() {
    try {
        console.log('Testing Permission query...');
        await sequelize.authenticate();
        
        const count = await Permission.count();
        console.log(`Count of permissions: ${count}`);
        
        const first = await Permission.findOne();
        if (first) {
            console.log('✔ Found a permission:', first.code);
        } else {
            console.log('✔ No permissions found (yet).');
        }

    } catch (error) {
        console.error('❌ Error during query test:', error);
    } finally {
        process.exit(0);
    }
}

testQuery();
