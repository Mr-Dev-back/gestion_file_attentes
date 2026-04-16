import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query('SELECT * FROM "User" LIMIT 1');
        console.log('User table exists', results);
    } catch (e) { console.error('User error:', e.message); }

    try {
        const [results] = await s.query('SELECT * FROM "Role" LIMIT 1');
        console.log('Role table exists', results);
    } catch (e) { console.error('Role error:', e.message); }

    try {
        const [results] = await s.query('SELECT * FROM "Permission" LIMIT 1');
        console.log('Permission table exists', results);
    } catch (e) { console.error('Permission error:', e.message); }

    try {
        const [results] = await s.query('SELECT * FROM "RolePermission" LIMIT 1');
        console.log('RolePermission table exists', results);
    } catch (e) { console.error('RolePermission error:', e.message); }
    
    process.exit(0);
}
check();
