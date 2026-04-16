import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('scratch/dump.json', 'utf8'));

const seederContent = `
import { 
    sequelize, Resource, Action, Permission, Role, RolePermission,
    Company, Site, Queue, Category, CategoryQueue,
    Workflow, WorkflowStep, WorkflowTransition, WorkflowStepQueue,
    QuaiParameter, QuaiConfig, QuaiQueue, SystemSetting,
    User, UserSite, UserQueue
} from '../models/index.js';
import logger from '../config/logger.js';

export const seedProduction = async () => {
    logger.info('Starting full production initialization seeding...');
    const transaction = await sequelize.transaction();

    try {
        // 1. Reference: Resources
        logger.info('Seeding Resources...');
        await Resource.bulkCreate(${JSON.stringify(dump.resources)}, { transaction, ignoreDuplicates: true });

        // 2. Reference: Actions
        logger.info('Seeding Actions...');
        await Action.bulkCreate(${JSON.stringify(dump.actions)}, { transaction, ignoreDuplicates: true });

        // 3. Reference: Companies
        logger.info('Seeding Companies...');
        await Company.bulkCreate(${JSON.stringify(dump.companies)}, { transaction, ignoreDuplicates: true });

        // 4. Reference: Categories
        logger.info('Seeding Categories...');
        await Category.bulkCreate(${JSON.stringify(dump.categories)}, { transaction, ignoreDuplicates: true });

        // 5. Reference: Workflows
        logger.info('Seeding Workflows...');
        await Workflow.bulkCreate(${JSON.stringify(dump.workflows)}, { transaction, ignoreDuplicates: true });

        // 6. Config: Permissions
        logger.info('Seeding Permissions...');
        await Permission.bulkCreate(${JSON.stringify(dump.permissions)}, { transaction, ignoreDuplicates: true });

        // 7. Config: Roles
        logger.info('Seeding Roles...');
        await Role.bulkCreate(${JSON.stringify(dump.roles)}, { transaction, ignoreDuplicates: true });

        // 8. Config: Sites
        logger.info('Seeding Sites...');
        await Site.bulkCreate(${JSON.stringify(dump.sites)}, { transaction, ignoreDuplicates: true });

        // 9. Workflow Details: Steps
        logger.info('Seeding Workflow Steps...');
        await WorkflowStep.bulkCreate(${JSON.stringify(dump.workflowSteps)}, { transaction, ignoreDuplicates: true });

        // 10. Workflow Details: Transitions
        logger.info('Seeding Workflow Transitions...');
        if (${dump.workflowTransitions.length} > 0) {
            await WorkflowTransition.bulkCreate(${JSON.stringify(dump.workflowTransitions)}, { transaction, ignoreDuplicates: true });
        }

        // 11. Operational: QuaiParameters
        logger.info('Seeding Quai Parameters...');
        await QuaiParameter.bulkCreate(${JSON.stringify(dump.quaiParameters)}, { transaction, ignoreDuplicates: true });

        // 12. Operational: Queues
        logger.info('Seeding Queues...');
        await Queue.bulkCreate(${JSON.stringify(dump.queues)}, { transaction, ignoreDuplicates: true });

        // 13. Associations: RolePermissions
        logger.info('Seeding Role-Permission associations...');
        if (${dump.rolePermissions.length} > 0) {
            await RolePermission.bulkCreate(${JSON.stringify(dump.rolePermissions)}, { transaction, ignoreDuplicates: true });
        }

        // 14. Associations: CategoryQueues
        logger.info('Seeding Category-Queue associations...');
        if (${dump.categoryQueues.length} > 0) {
            await CategoryQueue.bulkCreate(${JSON.stringify(dump.categoryQueues)}, { transaction, ignoreDuplicates: true });
        }

        // 15. Associations: WorkflowStepQueues
        logger.info('Seeding WorkflowStep-Queue associations...');
        if (${dump.workflowStepQueues.length} > 0) {
            await WorkflowStepQueue.bulkCreate(${JSON.stringify(dump.workflowStepQueues)}, { transaction, ignoreDuplicates: true });
        }

        // 16. Associations: QuaiQueues
        logger.info('Seeding Quai-Queue associations...');
        if (${dump.quaiQueues.length} > 0) {
            await QuaiQueue.bulkCreate(${JSON.stringify(dump.quaiQueues)}, { transaction, ignoreDuplicates: true });
        }

        // 17. Users
        logger.info('Seeding Users...');
        await User.bulkCreate(${JSON.stringify(dump.users)}, { transaction, ignoreDuplicates: true });

        // 18. Associations: UserSites & UserQueues
        logger.info('Seeding User associations...');
        if (${dump.userSites.length} > 0) {
            await UserSite.bulkCreate(${JSON.stringify(dump.userSites)}, { transaction, ignoreDuplicates: true });
        }
        if (${dump.userQueues.length} > 0) {
            await UserQueue.bulkCreate(${JSON.stringify(dump.userQueues)}, { transaction, ignoreDuplicates: true });
        }

        await transaction.commit();
        logger.info('Full production seeding completed successfully.');
    } catch (error) {
        await transaction.rollback();
        logger.error('Full production seeding failed:', error);
        throw error;
    }
};
\`;

fs.writeFileSync('src/seeders/productionInitSeeder.js', seederContent.trim());
console.log('Production seeder generated in src/seeders/productionInitSeeder.js');
