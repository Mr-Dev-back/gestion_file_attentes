import { Category, Queue, WorkflowStep, WorkflowStepQueue, CategoryQueue } from '../../src/models/index.js';
import { sequelize } from '../../src/config/database.js';

async function checkLinks() {
    try {
        console.log('--- Categories and their linked Queues ---');
        const categories = await Category.findAll({
            include: [{ model: Queue, as: 'queues' }]
        });
        categories.forEach(cat => {
            console.log(`Category: ${cat.name} (${cat.categoryId})`);
            cat.queues.forEach(q => {
                console.log(`  -> Linked Queue: ${q.name} (${q.queueId})`);
            });
            if (cat.queues.length === 0) console.log('  -> No queues linked');
        });

        console.log('\n--- Initial Workflow Steps and their linked Queues ---');
        const initialSteps = await WorkflowStep.findAll({
            where: { orderNumber: 1 },
            include: [{ model: Queue, as: 'queues' }]
        });
        initialSteps.forEach(step => {
            console.log(`Step: ${step.name} (Workflow: ${step.workflowId})`);
            step.queues.forEach(q => {
                console.log(`  -> Linked Queue: ${q.name} (${q.queueId})`);
            });
            if (step.queues.length === 0) console.log('  -> No queues linked');
        });

    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

checkLinks();
