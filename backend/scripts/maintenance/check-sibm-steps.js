import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [steps] = await s.query(`
            SELECT ws."stepId", ws."name" as step_name, q."queueId", q."name" as queue_name
            FROM "WorkflowStep" ws
            JOIN "Queue" q ON ws."queueId" = q."queueId"
            WHERE ws."workflowId" = '5ba9be69-43c4-49fd-93d1-89cd916f35cc'
        `);
        console.log('Steps for Standard SIBM:');
        steps.forEach(step => {
            console.log(`- ${step.step_name} -> Queue: ${step.queue_name} (${step.queueId})`);
        });
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
check();
