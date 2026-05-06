import { Category, Company, Site, Workflow, WorkflowStep, Queue } from '../models/index.js';
import logger from '../config/logger.js';

export const seedOperations = async () => {
    logger.info('Starting operational data seeding...');

    // 1. Create initial Company and Site
    const [company, companyCreated] = await Company.findOrCreate({
        where: { code: 'SIBM' },
        defaults: {
            name: 'SIBM - Société Ivoirienne de Béton Manufacturé',
            email: 'contact@sibm.ci'
        }
    });
    if (companyCreated) logger.info('Created company: SIBM');

    const [site, siteCreated] = await Site.findOrCreate({
        where: { code: 'SSP' },
        defaults: {
            name: 'SIBM San Pedro - Terminal Industriel',
            companyId: company.companyId
        }
    });
    if (siteCreated) logger.info('Created site: SSP');

    // 2. Create Categories
    const categoriesData = [
        { name: 'BÂTIMENT', prefix: 'BAT', color: '#3B82F6', estimatedDuration: 30 },
        { name: 'INFRASTRUCTURE', prefix: 'INFRA', color: '#F59E0B', estimatedDuration: 25 },
        { name: 'ELECTRICITE', prefix: 'ELECT', color: '#EF4444', estimatedDuration: 35 }
    ];

    for (const catData of categoriesData) {
        const [, created] = await Category.findOrCreate({
            where: { prefix: catData.prefix },
            defaults: catData
        });
        if (created) logger.info(`Created category: ${catData.name} (${catData.prefix})`);
    }

    // 3. Create Workflow
    const [workflow, workflowCreated] = await Workflow.findOrCreate({
        where: { name: 'Circuit Industriel SIBM' },
        defaults: {
            description: 'Workflow principal de gestion des flux camions SIBM'
        }
    });
    if (workflowCreated) logger.info('Created workflow: Circuit Industriel SIBM');

    // 4. Create Queues
    const queuesData = [
        { name: 'Bureau des Ventes', type: 'SALES', siteId: site.siteId, workflowId: workflow.workflowId },
        { name: 'Pont Bascule Entrée', type: 'WEIGH_IN', siteId: site.siteId, workflowId: workflow.workflowId },
        { name: 'Pont Bascule Sortie', type: 'WEIGH_OUT', siteId: site.siteId, workflowId: workflow.workflowId },
        { name: 'Zone de Chargement', type: 'LOADING', siteId: site.siteId, workflowId: workflow.workflowId }
    ];

    const queueMap = {};
    for (const qData of queuesData) {
        const [queue, created] = await Queue.findOrCreate({
            where: { name: qData.name, siteId: site.siteId },
            defaults: qData
        });
        queueMap[qData.type] = queue;
        if (created) logger.info(`Created queue: ${qData.name}`);
    }

    // 5. Create Workflow Steps
    const stepsData = [
        { name: 'Bureau des Ventes', code: 'SALES', queueId: queueMap.SALES.queueId, orderNumber: 1 },
        { name: 'Pesée Entrée', code: 'WEIGH_IN', queueId: queueMap.WEIGH_IN.queueId, orderNumber: 2 },
        { name: 'Chargement / Parcs', code: 'LOADING', queueId: queueMap.LOADING.queueId, orderNumber: 3 },
        { name: 'Pesée Sortie', code: 'WEIGH_OUT', queueId: queueMap.WEIGH_OUT.queueId, orderNumber: 4 }
    ];

    for (const sData of stepsData) {
        const [, created] = await WorkflowStep.findOrCreate({
            where: { stepCode: sData.code, workflowId: workflow.workflowId },
            defaults: {
                ...sData,
                workflowId: workflow.workflowId
            }
        });
        if (created) logger.info(`Created workflow step: ${sData.name}`);
    }

    logger.info('Operational data seeding completed.');
};
