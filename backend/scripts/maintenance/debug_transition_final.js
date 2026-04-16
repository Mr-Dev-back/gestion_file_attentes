import { Ticket, WorkflowStep, Queue, Workflow, TicketHistory, TicketLogistic } from './src/models/index.js';
import { sequelize } from './src/config/database.js';
import fs from 'fs';

async function debugTransition() {
    let out = '--- Simulating Transition Detail ---\n\n';
    try {
        const ticketId = '9e04b77d-0bbc-4abe-ae0c-454d22f9862b';

        const ticket = await Ticket.findByPk(ticketId, {
            include: [
                { model: WorkflowStep, as: 'step' },
                { model: TicketLogistic, as: 'logistic' },
                {
                    model: Queue,
                    as: 'queue',
                    include: [{
                        model: Workflow,
                        as: 'workflow',
                        include: [{ model: WorkflowStep, as: 'steps' }]
                    }]
                }
            ]
        });

        if (!ticket) {
            out += 'Ticket not found\n';
        } else {
            out += `Ticket: ${ticket.ticketNumber} (${ticket.ticketId})\n`;
            out += `Current Step: ${ticket.step?.name} (${ticket.stepId})\n`;
            out += `Current Queue: ${ticket.queue?.name} (${ticket.queueId})\n`;

            const workflow = ticket.queue?.workflow;
            if (!workflow) {
                out += 'CRITICAL: No workflow found for this queue!\n';
            } else {
                out += `Workflow: ${workflow.name} (${workflow.workflowId})\n`;
                const steps = workflow.steps || [];
                out += `Steps count: ${steps.length}\n`;

                const sortedSteps = steps.sort((a, b) => a.order - b.order);
                sortedSteps.forEach(s => {
                    out += `  - [${s.order}] ${s.name} (Code: ${s.code}, ID: ${s.stepId}) [QueueID: ${s.queueId}]\n`;
                });

                const currentIndex = ticket.stepId ? sortedSteps.findIndex(s => s.stepId === ticket.stepId) : -1;
                out += `Current Index in sorted steps: ${currentIndex}\n`;

                if (currentIndex !== -1 && currentIndex < sortedSteps.length - 1) {
                    const nextStep = sortedSteps[currentIndex + 1];
                    out += `Next Step identified: ${nextStep.name} (ID: ${nextStep.stepId})\n`;
                    out += `Next Queue ID: ${nextStep.queueId}\n`;

                    const nextQueue = await Queue.findByPk(nextStep.queueId);
                    out += `Next Queue Name: ${nextQueue?.name || 'NOT_FOUND'}\n`;
                } else {
                    out += 'Next Step NOT FOUND (Index mismatch or last step reached)\n';
                }
            }
        }

    } catch (error) {
        out += `ERROR: ${error.message}\n${error.stack}\n`;
    } finally {
        fs.writeFileSync('transition_debug_final.log', out);
        await sequelize.close();
        process.exit(0);
    }
}

debugTransition();
