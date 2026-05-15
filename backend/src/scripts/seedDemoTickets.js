import { Ticket, Category, Site, WorkflowStep, Queue, TicketVehicleInfo, TicketLogistic, TicketActionLog, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

async function seedDemoTickets() {
    const transaction = await sequelize.transaction();
    try {
        console.log('--- Génération de données de démo ---');

        const site = await Site.findOne({ order: [['createdAt', 'ASC']], transaction });
        
        // NETTOYAGE : Supprimer les anciens tickets pour repartir à zéro (Optionnel mais conseillé pour la démo)
        if (site) {
            await Ticket.destroy({ where: { siteId: site.siteId }, transaction });
            console.log('🗑️ Anciens tickets supprimés.');
        }

        const categories = await Category.findAll({ where: { isActive: true }, transaction });
        
        if (!site || categories.length === 0) {
            throw new Error('Site ou catégories introuvables. Lancez d\'abord le seed de production.');
        }

        const steps = await WorkflowStep.findAll({
            where: { workflowId: site.workflowId },
            order: [['orderNumber', 'ASC']],
            include: ['queues'],
            transaction
        });

        const demoData = [
            { plate: 'AA-123-BB', driver: 'Jean Kouassi', company: 'TRANOCO', stepIdx: 0, status: 'EN_ATTENTE' },
            { plate: 'CC-456-DD', driver: 'Moussa Diabaté', company: 'SIBM LOGISTICS', stepIdx: 0, status: 'EN_ATTENTE' },
            { plate: 'EE-789-FF', driver: 'Paul Yao', company: 'CIMAF', stepIdx: 1, status: 'EN_ATTENTE' },
            { plate: 'GG-101-HH', driver: 'Koffi Konan', company: 'SOTRA', stepIdx: 2, status: 'EN_ATTENTE' },
            { plate: 'II-202-JJ', driver: 'Adama Traoré', company: 'BOLLORE', stepIdx: 1, status: 'EN_ATTENTE' },
            { plate: 'KK-303-LL', driver: 'Bakary Touré', company: 'PST', stepIdx: 3, status: 'EN_ATTENTE' },
            { plate: 'MM-404-NN', driver: 'Oumar Sylla', company: 'GLOBAL TRANS', stepIdx: 0, status: 'EN_ATTENTE', priority: 1 },
            { plate: 'OO-505-PP', driver: 'Yacouba Bamba', company: 'TRANOCO', stepIdx: 2, status: 'EN_ATTENTE' },
        ];

        for (const data of demoData) {
            const step = steps[data.stepIdx] || steps[0];
            const cat = categories[Math.floor(Math.random() * categories.length)];
            const queueId = step.queues?.[0]?.queueId || null;

            const ticketNumber = `${site.code || 'GP'}${cat.prefix || 'GEN'}-${Math.floor(1000 + Math.random() * 9000)}`;

            const ticket = await Ticket.create({
                ticketNumber,
                siteId: site.siteId,
                categoryId: cat.categoryId,
                currentStepId: step.stepId,
                queueId: queueId,
                status: data.status,
                priority: data.priority || 0,
                driverName: data.driver,
                licensePlate: data.plate,
                companyName: data.company,
                arrivedAt: new Date(Date.now() - Math.random() * 3600000),
                startedAt: data.status === 'PROCESSING' ? new Date() : null
            }, { transaction });

            await TicketVehicleInfo.create({
                ticketId: ticket.ticketId,
                licensePlate: data.plate,
                driverName: data.driver,
                companyName: data.company
            }, { transaction });

            await TicketLogistic.create({
                ticketId: ticket.ticketId,
                orderNumber: `CMD-${Math.floor(10000 + Math.random() * 90000)}`,
                plannedQuantity: 25
            }, { transaction });

            console.log(`✅ Ticket créé : ${ticketNumber} (${data.plate}) - Statut: ${data.status}`);
        }

        await transaction.commit();
        console.log('\n--- Fin de la génération ---');
        process.exit(0);
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('❌ Erreur démo seed:', error);
        process.exit(1);
    }
}

seedDemoTickets();
