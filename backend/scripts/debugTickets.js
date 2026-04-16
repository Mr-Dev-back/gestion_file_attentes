import { sequelize, Ticket, Site, WorkflowStep } from '../models/index.js';

async function run() {
    await sequelize.authenticate();
    const tickets = await Ticket.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: ['currentStep', 'queue', 'site', 'category']
    });
    console.log(JSON.stringify(tickets, null, 2));
    process.exit(0);
}
run();
