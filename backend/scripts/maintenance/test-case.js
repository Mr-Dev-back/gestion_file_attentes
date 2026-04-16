import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query('SELECT isActived FROM "Site" LIMIT 1');
        console.log('Query without quotes success:', results);
    } catch (e) { 
        console.error('Query without quotes failed:', e.message);
    }
    
    try {
        const [results] = await s.query('SELECT "isActived" FROM "Site" LIMIT 1');
        console.log('Query with quotes success:', results);
    } catch (e) { 
        console.error('Query with quotes failed:', e.message);
    }
    process.exit(0);
}
check();
