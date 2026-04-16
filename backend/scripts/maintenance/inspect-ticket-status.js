import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function run() {
    try {
        const [r] = await s.query(`
            SELECT t."ticketId", t."ticketNumber", t."status", t."currentStepId",
                   ws."name" as step_name, ws."queueId", q."name" as queue_name
            FROM "Ticket" t
            LEFT JOIN "WorkflowStep" ws ON t."currentStepId" = ws."stepId"
            LEFT JOIN "Queue" q ON ws."queueId" = q."queueId"
            WHERE t."ticketId" = '0fbb599a-aa40-4b50-b9b7-84dda8e2f798'
        `);
        console.log(JSON.stringify(r, null, 2));
    } catch (e) { console.error(e); }
    process.exit(0);
}
run();
