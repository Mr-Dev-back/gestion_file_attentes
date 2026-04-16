import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
    sequelize, Resource, Action, Permission, Role, RolePermission,
    Company, Site, Queue, Category, CategoryQueue,
    Workflow, WorkflowStep, WorkflowTransition, WorkflowStepQueue,
    QuaiParameter, QuaiConfig, QuaiQueue, SystemSetting,
    User, UserSite, UserQueue
} from '../models/index.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const seedProduction = async () => {
    logger.info('Starting full production initialization seeding from production_data.json...');
    const transaction = await sequelize.transaction();

    try {
        const dataPath = path.join(__dirname, 'production_data.json');
        if (!fs.existsSync(dataPath)) {
            throw new Error(`Data file not found at ${dataPath}`);
        }
        
        const dump = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        // 1. Reference: Resources
        logger.info('Seeding Resources...');
        await Resource.bulkCreate(dump.resources, { transaction, ignoreDuplicates: true });

        // 2. Reference: Actions
        logger.info('Seeding Actions...');
        await Action.bulkCreate(dump.actions, { transaction, ignoreDuplicates: true });

        // 3. Reference: Companies
        logger.info('Seeding Companies...');
        await Company.bulkCreate(dump.companies, { transaction, ignoreDuplicates: true });

        // 4. Reference: Categories
        logger.info('Seeding Categories...');
        await Category.bulkCreate(dump.categories, { transaction, ignoreDuplicates: true });

        // 5. Reference: Workflows
        logger.info('Seeding Workflows...');
        await Workflow.bulkCreate(dump.workflows, { transaction, ignoreDuplicates: true });

        // 6. Config: Permissions
        logger.info('Seeding Permissions...');
        await Permission.bulkCreate(dump.permissions, { transaction, ignoreDuplicates: true });

        // 7. Config: Roles
        logger.info('Seeding Roles...');
        await Role.bulkCreate(dump.roles, { transaction, ignoreDuplicates: true });

        // 8. Config: Sites
        logger.info('Seeding Sites...');
        await Site.bulkCreate(dump.sites, { transaction, ignoreDuplicates: true });

        // 9. Workflow Details: Steps
        logger.info('Seeding Workflow Steps...');
        await WorkflowStep.bulkCreate(dump.workflowSteps, { transaction, ignoreDuplicates: true });

        // 10. Workflow Details: Transitions
        logger.info('Seeding Workflow Transitions...');
        if (dump.workflowTransitions && dump.workflowTransitions.length > 0) {
            await WorkflowTransition.bulkCreate(dump.workflowTransitions, { transaction, ignoreDuplicates: true });
        }

        // 11. Operational: QuaiParameters
        logger.info('Seeding Quai Parameters...');
        await QuaiParameter.bulkCreate(dump.quaiParameters, { transaction, ignoreDuplicates: true });

        // 12. Operational: Queues
        logger.info('Seeding Queues...');
        await Queue.bulkCreate(dump.queues, { transaction, ignoreDuplicates: true });

        // 13. Associations: RolePermissions
        logger.info('Seeding Role-Permission associations...');
        if (dump.rolePermissions && dump.rolePermissions.length > 0) {
            await RolePermission.bulkCreate(dump.rolePermissions, { transaction, ignoreDuplicates: true });
        }

        // 14. Associations: CategoryQueues
        logger.info('Seeding Category-Queue associations...');
        if (dump.categoryQueues && dump.categoryQueues.length > 0) {
            await CategoryQueue.bulkCreate(dump.categoryQueues, { transaction, ignoreDuplicates: true });
        }

        // 15. Associations: WorkflowStepQueues
        logger.info('Seeding WorkflowStep-Queue associations...');
        if (dump.workflowStepQueues && dump.workflowStepQueues.length > 0) {
            await WorkflowStepQueue.bulkCreate(dump.workflowStepQueues, { transaction, ignoreDuplicates: true });
        }

        // 16. Associations: QuaiQueues
        logger.info('Seeding Quai-Queue associations...');
        if (dump.quaiQueues && dump.quaiQueues.length > 0) {
            await QuaiQueue.bulkCreate(dump.quaiQueues, { transaction, ignoreDuplicates: true });
        }

        // 17. Users
        logger.info('Seeding Users...');
        await User.bulkCreate(dump.users, { transaction, ignoreDuplicates: true });

        // 18. Associations: UserSites & UserQueues
        logger.info('Seeding User associations...');
        if (dump.userSites && dump.userSites.length > 0) {
            await UserSite.bulkCreate(dump.userSites, { transaction, ignoreDuplicates: true });
        }
        if (dump.userQueues && dump.userQueues.length > 0) {
            await UserQueue.bulkCreate(dump.userQueues, { transaction, ignoreDuplicates: true });
        }

        await transaction.commit();
        logger.info('Full production seeding completed successfully.');
    } catch (error) {
        if (transaction) await transaction.rollback();
        logger.error('Full production seeding failed:', error);
        throw error;
    }
};
