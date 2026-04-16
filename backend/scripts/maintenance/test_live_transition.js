import { Ticket, WorkflowStep, Queue, Workflow, TicketHistory, TicketLogistic, User } from './src/models/index.js';
import workflowService from './src/services/workflowService.js';
import { sequelize } from './src/config/database.js';
import fs from 'fs';

async function testTransition() {
    let log = '';
    const logWriter = (msg) => {
        log += msg + '\n';
        console.log(msg);
    };

    sequelize.options.logging = (sql) => {
        log += 'SQL: ' + sql + '\n';
    };

    const transaction = await sequelize.transaction();
    try {
        logWriter('--- Reseting Ticket for Transition Test ---');
        const ticketNumber = 'T-20260302-0001';

        const ticket = await Ticket.findOne({
            where: { ticketNumber },
            include: [{ model: WorkflowStep, as: 'step' }],
            transaction
        });

        if (!ticket) {
            logWriter('Ticket not found');
            await transaction.rollback();
            return;
        }

        const salesStep = await WorkflowStep.findOne({ where: { code: 'SALES' }, transaction });
        const salesQueue = await Queue.findOne({ where: { name: 'Bureau des Ventes' }, transaction });

        await ticket.update({
            status: 'EN_TRAITEMENT',
            stepId: salesStep.stepId,
            queueId: salesQueue.queueId,
            completedAt: null
        }, { transaction });

        logWriter('Triggering moveToNextStep...');
        const result = await workflowService.moveToNextStep(ticket.ticketId, null, transaction);

        logWriter('Transition Result: ' + JSON.stringify(result, null, 2));

        await transaction.commit();
        logWriter('--- Test Completed Successfully ---');

    } catch (error) {
        await transaction.rollback();
        logWriter('Test FAILED: ' + error.message);
        if (error.sql) logWriter('FAILED SQL: ' + error.sql);
        logWriter('STACK: ' + error.stack);
    } finally {
        fs.writeFileSync('transition_final.log', log);
        await sequelize.close();
        process.exit(0);
    }
}

testTransition();
