import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [categories] = await s.query('SELECT "categoryId", "name" FROM "Category"');
        console.log('Categories in DB:');
        categories.forEach(c => console.log(`- ${c.name}: ${c.categoryId}`));
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
check();
