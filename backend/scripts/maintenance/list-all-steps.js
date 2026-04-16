import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function run() {
    try {
        const [r] = await s.query('SELECT "stepId", "name", "order", "workflowId", "queueId" FROM "WorkflowStep" ORDER BY "workflowId", "order"');
        console.log(JSON.stringify(r, null, 2));
    } catch (e) { console.error(e); }
    process.exit(0);
}
run();
