import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [results] = await s.query('SELECT * FROM "WorkflowStep" WHERE "workflowId" = \'eb9b8d4d-5ec9-4968-a936-55fda8d80882\'');
        console.log('WorkflowSteps:', results);
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
check();
