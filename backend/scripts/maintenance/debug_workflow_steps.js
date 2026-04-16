import { Ticket, WorkflowStep, Queue, Workflow, TicketHistory } from './src/models/index.js';
import { sequelize } from './src/config/database.js';
import fs from 'fs';

async function debug() {
    let log = '\n--- Workflow Debug (Step/Workflow Validation) ---\n\n';
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
            log += `  Step StepID: ${t.stepId}\n`;
            log += `  Step WorkflowID: ${t.step?.workflowId || 'NONE'}\n`;
            log += `  Queue: ${t.queue?.name || 'NONE'}\n`;
            log += `  Queue WorkflowID: ${t.queue?.workflowId || 'NONE'}\n`;

            if (t.queueId) {
                const workflow = await Workflow.findByPk(t.queue?.workflowId, {
                    include: [{ model: WorkflowStep, as: 'steps' }]
                });
                if (workflow) {
                    log += `  Workflow: ${workflow.name} (${workflow.workflowId})\n`;
                    log += '  Steps in this Workflow:\n';
                    workflow.steps.sort((a, b) => a.order - b.order).forEach(s => {
                        log += `    - [${s.order}] ${s.name} (ID: ${s.stepId}) ${s.stepId === t.stepId ? '[MATCH CURRENT]' : ''}\n`;
                    });

                    const currentIndex = t.stepId ? workflow.steps.findIndex(s => s.stepId === t.stepId) : -1;
                    log += `  Current Index in Workflow: ${currentIndex}\n`;
                } else {
                    log += '  No workflow found for this queue.\n';
                }
            }
            log += '------------------\n\n';
        }
    } catch (error) {
        log += `ERROR: ${error.message}\n`;
        log += `STACK: ${error.stack}\n`;
    } finally {
        fs.writeFileSync('workflow_debug_steps.log', log);
        await sequelize.close();
        process.exit(0);
    }
}

debug();
