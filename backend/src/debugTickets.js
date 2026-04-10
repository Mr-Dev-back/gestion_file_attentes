import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import { sequelize } from './config/database.js';
import { Ticket, Site, WorkflowStep } from './models/index.js';

async function run() {
    await sequelize.authenticate();
    const tickets = await Ticket.findAll({
        order: [['arrivedAt', 'DESC']],
        limit: 5,
        include: ['currentStep', 'queue', 'site', 'category']
    });
    console.log(JSON.stringify(tickets, null, 2));
    process.exit(0);
}
run();
