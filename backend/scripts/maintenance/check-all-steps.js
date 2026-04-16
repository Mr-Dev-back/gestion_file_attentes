import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [steps] = await s.query('SELECT "stepId", "name", "workflowId" FROM "WorkflowStep"');
        console.log('Workflow Steps:');
        steps.forEach(step => {
            console.log(`- Step: ${step.name}, Workflow: ${step.workflowId}`);
        });
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
check();
