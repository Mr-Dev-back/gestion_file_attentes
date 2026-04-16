import { Sequelize } from 'sequelize';
import { Ticket, WorkflowStep, Category, Queue } from '../../src/models/index.js';

const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres', logging: false });

async function testApiLogic() {
    try {
        const queueId = '6da10606-181a-4efe-ab8e-f9426fe69be9'; // Pont Bascule
        
        console.log('--- Testing Logic for Queue:', queueId);

        const include = [
            { model: Category, as: 'category' },
            { 
                model: WorkflowStep, 
                as: 'currentStep', 
                where: { queueId },
                include: [{ model: Queue, as: 'queue' }] 
            }
        ];

        const tickets = await Ticket.findAll({
            include,
            order: [['priority', 'DESC'], ['arrivedAt', 'ASC']]
        });

        console.log(`Found ${tickets.length} tickets for this queue.`);
        tickets.forEach(t => {
            console.log(`- Ticket: ${t.ticketNumber}, Status: ${t.status}, Step: ${t.currentStep?.name}`);
        });

    } catch (e) { console.error('Error:', e); }
    process.exit(0);
}

testApiLogic();
