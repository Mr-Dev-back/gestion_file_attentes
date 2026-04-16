import { Ticket, WorkflowStep, Queue, Workflow, TicketHistory } from './src/models/index.js';
import workflowService from './src/services/workflowService.js';
import { sequelize } from './src/config/database.js';

// Disable logging
sequelize.options.logging = false;

async function debug() {
    try {
        console.log('\n--- Workflow Debug (Full) ---\n');

        const tickets = await Ticket.findAll({
            include: [
                { model: WorkflowStep, as: 'step' },
                { model: Queue, as: 'queue' }
            ],
            limit: 3,
            order: [['updatedAt', 'DESC']]
        });

        if (tickets.length === 0) {
            console.log('No tickets found.');
        }

        for (const t of tickets) {
            console.log(`Ticket: ${t.ticketNumber}`);
            console.log(`  ID: ${t.ticketId}`);
            console.log(`  Current Status: ${t.status}`);
            console.log(`  Current Step: ${t.step?.name || 'NONE'} (${t.step?.code || 'NO_CODE'})`);
            console.log(`  Current Queue: ${t.queue?.name || 'NONE'} (${t.queueId})`);

            const history = await TicketHistory.findAll({
                where: { ticketId: t.ticketId },
                order: [['createdAt', 'ASC']]
            });
            console.log('  History:');
            history.forEach(h => {
                const stepFrom = h.fromStepId ? 'STEP_OLD' : 'N/A';
                const stepTo = h.toStepId ? 'STEP_NEW' : 'N/A';
                console.log(`    - [${h.createdAt.toISOString()}] ${h.event}: ${h.fromStatus || 'N/A'} -> ${h.toStatus || 'N/A'}`);
            });

            if (t.queueId) {
                const queue = await Queue.findByPk(t.queueId, {
                    include: [{
                        model: Workflow,
                        as: 'workflow',
                        include: [{ model: WorkflowStep, as: 'steps' }]
                    }]
                });
                if (queue?.workflow?.steps) {
                    console.log('  Current Workflow Steps:');
                    queue.workflow.steps.sort((a, b) => a.order - b.order).forEach(s => {
                        console.log(`    - [${s.order}] ${s.name} (${s.code}) [${s.stepId === t.stepId ? 'CURRENT' : ''}]`);
                    });
                } else {
                    console.log('  No workflow steps found for this queue.');
                }
            }
            console.log('------------------\n');
        }

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        await sequelize.close();
    }
}

debug();
