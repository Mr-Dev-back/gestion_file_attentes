import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query('SELECT "siteId", "companyId", "workflowId", "name", "code", "address", "alertThreshold", "isActived", "createdAt" FROM "Site" AS "Site" LIMIT 1');
        console.log('Query success:', results);
    } catch (e) { 
        console.error('Query failed:', e.message);
        console.error('Stack:', e.stack);
    }
    process.exit(0);
}
check();
