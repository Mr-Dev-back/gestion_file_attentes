import logger from '../config/logger.js';
import {
    sequelize, Resource, Action, Permission, Role, RolePermission,
    Company, Site, Queue, Category, CategoryQueue,
    Workflow, WorkflowStep, WorkflowTransition,
    QuaiParameter, QuaiQueue, WorkflowStepQueue
} from '../models/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Helper to upsert data and maintain a mapping of JSON IDs to DB IDs
 */
async function smartSeed(Model, data, uniqueKey, transaction, idMap = {}, modelIdField) {
    const modelName = Model.name;
    const resultsMap = { ...idMap };
    
    logger.info(`Processing ${data.length} items for ${modelName}...`);
    
    for (const item of data) {
        // Deep copy to avoid mutating original dump
        const recordData = { ...item };
        const jsonId = recordData[modelIdField];
        
        // Replace known FKs in recordData using idMap
        for (const [key, value] of Object.entries(recordData)) {
            if (idMap[value]) {
                recordData[key] = idMap[value];
            }
        }

        // Find existing record by unique key
        const existing = await Model.findOne({
            where: { [uniqueKey]: recordData[uniqueKey] },
            transaction
        });

        if (existing) {
            // Update existing record with new data (excluding ID to be safe)
            const { [modelIdField]: _, ...updateData } = recordData;
            await existing.update(updateData, { transaction });
            resultsMap[jsonId] = existing[modelIdField];
        } else {
            // Create new record
            const created = await Model.create(recordData, { transaction });
            resultsMap[jsonId] = created[modelIdField];
        }
    }
    
    return resultsMap;
}

export async function seedProduction() {
    const transaction = await sequelize.transaction();
    try {
        const dataPath = path.join(__dirname, 'production_data.json');
        const rawData = await fs.readFile(dataPath, 'utf8');
        const dump = JSON.parse(rawData);

        logger.info('Starting smart production initialization seeding...');
        
        // Map to keep track of JSON ID -> DB ID translations
        let idMap = {};

        // 1. Resources (Unique by slug)
        idMap = await smartSeed(Resource, dump.resources, 'slug', transaction, idMap, 'resourceId');

        // 2. Actions (Unique by slug)
        idMap = await smartSeed(Action, dump.actions, 'slug', transaction, idMap, 'actionId');

        // 3. Companies (Unique by code)
        idMap = await smartSeed(Company, dump.companies, 'code', transaction, idMap, 'companyId');

        // 4. Categories (Unique by prefix)
        idMap = await smartSeed(Category, dump.categories, 'prefix', transaction, idMap, 'categoryId');

        // 5. Workflows (Unique by name)
        idMap = await smartSeed(Workflow, dump.workflows, 'name', transaction, idMap, 'workflowId');

        // 6. Permissions (Unique by code)
        // Ensure name is present before seeding
        const processedPermissions = dump.permissions.map(p => ({
            ...p,
            name: p.name || p.code,
            guardName: p.guardName || 'api'
        }));
        idMap = await smartSeed(Permission, processedPermissions, 'code', transaction, idMap, 'permissionId');

        // 7. Roles (Unique by name)
        idMap = await smartSeed(Role, dump.roles, 'name', transaction, idMap, 'roleId');

        // 8. Sites (Unique by code)
        idMap = await smartSeed(Site, dump.sites, 'code', transaction, idMap, 'siteId');

        // 9. Workflow Steps (Unique by stepCode)
        idMap = await smartSeed(WorkflowStep, dump.workflowSteps, 'stepCode', transaction, idMap, 'stepId');

        // 10. Workflow Transitions (No natural unique key, use bulkCreate for now)
        logger.info(`Seeding ${dump.workflowTransitions.length} Workflow Transitions...`);
        const processedTransitions = dump.workflowTransitions.map(t => ({
            ...t,
            workflowId: idMap[t.workflowId] || t.workflowId,
            fromStepId: idMap[t.fromStepId] || t.fromStepId,
            toStepId: idMap[t.toStepId] || t.toStepId
        }));
        await WorkflowTransition.bulkCreate(processedTransitions, { transaction, ignoreDuplicates: true });

        // 11. QuaiParameters (Unique by label + siteId context or just label)
        idMap = await smartSeed(QuaiParameter, dump.quaiParameters, 'label', transaction, idMap, 'quaiId');

        // 12. Queues (Unique by name + siteId)
        idMap = await smartSeed(Queue, dump.queues, 'name', transaction, idMap, 'queueId');

        // 13. Users (Unique by username or email)
        idMap = await smartSeed(User, dump.users, 'username', transaction, idMap, 'userId');

        // 14. Pivot tables / Associations
        logger.info('Seeding Associations...');
        
        if (dump.rolePermissions && dump.rolePermissions.length > 0) {
            const processedRP = dump.rolePermissions.map(rp => ({
                ...rp,
                roleId: idMap[rp.roleId] || rp.roleId,
                permissionId: idMap[rp.permissionId] || rp.permissionId
            }));
            await RolePermission.bulkCreate(processedRP, { transaction, ignoreDuplicates: true });
        }

        if (dump.modelHasRoles && dump.modelHasRoles.length > 0) {
            const processedMHR = dump.modelHasRoles.map(mhr => ({
                ...mhr,
                modelId: idMap[mhr.modelId] || mhr.modelId,
                roleId: idMap[mhr.roleId] || mhr.roleId
            }));
            await ModelHasRole.bulkCreate(processedMHR, { transaction, ignoreDuplicates: true });
        }

        if (dump.modelHasPermissions && dump.modelHasPermissions.length > 0) {
            const processedMHP = dump.modelHasPermissions.map(mhp => ({
                ...mhp,
                modelId: idMap[mhp.modelId] || mhp.modelId,
                permissionId: idMap[mhp.permissionId] || mhp.permissionId
            }));
            await ModelHasPermission.bulkCreate(processedMHP, { transaction, ignoreDuplicates: true });
        }

        if (dump.quaiQueues && dump.quaiQueues.length > 0) {
            const processedQQ = dump.quaiQueues.map(qq => ({
                ...qq,
                quaiId: idMap[qq.quaiId] || qq.quaiId,
                queueId: idMap[qq.queueId] || qq.queueId
            }));
            await QuaiQueue.bulkCreate(processedQQ, { transaction, ignoreDuplicates: true });
        }

        if (dump.workflowStepQueues && dump.workflowStepQueues.length > 0) {
            const processedWSQ = dump.workflowStepQueues.map(wsq => ({
                ...wsq,
                stepId: idMap[wsq.stepId] || wsq.stepId,
                queueId: idMap[wsq.queueId] || wsq.queueId
            }));
            await WorkflowStepQueue.bulkCreate(processedWSQ, { transaction, ignoreDuplicates: true });
        }

        if (dump.categoryQueues && dump.categoryQueues.length > 0) {
            const processedCQ = dump.categoryQueues.map(cq => ({
                ...cq,
                categoryId: idMap[cq.categoryId] || cq.categoryId,
                queueId: idMap[cq.queueId] || cq.queueId
            }));
            await CategoryQueue.bulkCreate(processedCQ, { transaction, ignoreDuplicates: true });
        }

        await transaction.commit();
        logger.info('Production seeding completed successfully with ID mapping.');

    } catch (error) {
        await transaction.rollback();
        logger.error('Full production seeding failed:', error);
        throw error;
    }
}
