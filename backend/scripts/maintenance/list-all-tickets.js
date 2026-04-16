import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [tickets] = await s.query(`
            SELECT t."ticketId", t."ticketNumber", t."status", ws."name" as step_name, q."name" as queue_name
            FROM "Ticket" t
            LEFT JOIN "WorkflowStep" ws ON t."currentStepId" = ws."stepId"
            LEFT JOIN "Queue" q ON ws."queueId" = q."queueId"
        `);
        console.log('Tickets in DB:');
        tickets.forEach(t => {
            console.log(`- ${t.ticketNumber} (${t.status}) @ Step: ${t.step_name}, Queue: ${t.queue_name}`);
        });
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
check();
