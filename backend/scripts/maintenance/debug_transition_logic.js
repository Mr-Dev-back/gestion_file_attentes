import { Ticket, WorkflowStep, Queue, Workflow, TicketHistory, TicketLogistic } from './src/models/index.js';
import { sequelize } from './src/config/database.js';

async function debugTransition() {
    console.log('--- Simulating Transition ---');
    try {
        const ticketId = '9e04b77d-0bbc-4abe-ae0c-454d22f9862b'; // T-20260302-0001

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
            console.log('Ticket not found');
            return;
        }

        console.log(`Ticket: ${ticket.ticketNumber}`);
        console.log(`Step: ${ticket.step?.name || 'NONE'} (${ticket.stepId})`);
        console.log(`Queue: ${ticket.queue?.name || 'NONE'} (${ticket.queueId})`);
        console.log(`Workflow: ${ticket.queue?.workflow?.name || 'NONE'}`);

        if (!ticket.queue?.workflow) {
            console.log('Error: No workflow attached to queue');
        } else {
            const steps = ticket.queue.workflow.steps || [];
            console.log(`Total steps in workflow: ${steps.length}`);

            const sortedSteps = steps.sort((a, b) => a.order - b.order);
            sortedSteps.forEach(s => {
                console.log(`  [${s.order}] ${s.name} (${s.stepId})`);
            });

            const currentIndex = ticket.stepId ? sortedSteps.findIndex(s => s.stepId === ticket.stepId) : -1;
            console.log(`Current Index found: ${currentIndex}`);

            if (currentIndex !== -1 && currentIndex < sortedSteps.length - 1) {
                const nextStep = sortedSteps[currentIndex + 1];
                console.log(`Next Step FOUND: ${nextStep.name} (ID: ${nextStep.stepId}) on Queue: ${nextStep.queueId}`);
            } else {
                console.log('Next Step NOT FOUND (or last step)');
            }
        }

    } catch (error) {
        console.error('Transition debug failed:', error);
    } finally {
        await sequelize.close();
    }
}

debugTransition();
