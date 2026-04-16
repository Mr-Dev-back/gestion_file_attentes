import { Ticket, WorkflowStep, Queue, Workflow, TicketHistory } from './src/models/index.js';
import { sequelize } from './src/config/database.js';
import fs from 'fs';

async function debug() {
    let log = '\n--- Workflow Debug (Simplified) ---\n\n';
    try {
        const tickets = await Ticket.findAll({
            include: [
                { model: WorkflowStep, as: 'step' },
                { model: Queue, as: 'queue' }
            ],
            limit: 3,
            order: [['updatedAt', 'DESC']]
        });

        for (const t of tickets) {
            log += `Ticket: ${t.ticketNumber}\n`;
            log += `  Status: ${t.status}\n`;
            log += `  Step: ${t.step?.name || 'NONE'} (${t.step?.code || 'NO_CODE'})\n`;
            log += `  Queue: ${t.queue?.name || 'NONE'}\n`;

            const history = await TicketHistory.findAll({
                where: { ticketId: t.ticketId },
                order: [['createdAt', 'ASC']]
            });
            log += '  History Events:\n';
            history.forEach(h => {
                log += `    - [${h.event}] ${h.fromStatus || 'N/A'} -> ${h.toStatus || 'N/A'}\n`;
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
                    log += '  Steps in Workflow:\n';
                    queue.workflow.steps.sort((a, b) => a.order - b.order).forEach(s => {
                        log += `    - [${s.order}] ${s.name} (${s.code}) ${s.stepId === t.stepId ? '[CURRENT]' : ''}\n`;
                    });
                }
            }
            log += '------------------\n\n';
        }
    } catch (error) {
        log += `ERROR: ${error.message}\n`;
    } finally {
        fs.writeFileSync('workflow_debug.log', log);
        await sequelize.close();
        process.exit(0);
    }
}

debug();
