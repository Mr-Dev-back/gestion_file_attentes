import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
    sequelize, Resource, Action, Permission, Role,
    Company, Site, Queue, Category,
    Workflow, WorkflowStep, WorkflowTransition,
    QuaiParameter, SystemSetting,
    User, RolePermission, CategoryQueue, WorkflowStepQueue, QuaiQueue, UserSite, UserQueue
} from '../models/index.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportData() {
    try {
        await sequelize.authenticate();
        logger.info('Connected to database for export.');

        const dump = {};

        // Helper to fetch all from a model
        const fetchAll = async (model) => {
            const data = await model.findAll();
            return data.map(d => d.toJSON());
        };

        logger.info('Exporting Reference data...');
        dump.resources = await fetchAll(Resource);
        dump.actions = await fetchAll(Action);
        dump.companies = await fetchAll(Company);
        dump.categories = await fetchAll(Category);
        dump.workflows = await fetchAll(Workflow);
        dump.permissions = await fetchAll(Permission);
        dump.roles = await fetchAll(Role);
        dump.sites = await fetchAll(Site);
        dump.workflowSteps = await fetchAll(WorkflowStep);
        dump.workflowTransitions = await fetchAll(WorkflowTransition);
        dump.quaiParameters = await fetchAll(QuaiParameter);
        dump.queues = await fetchAll(Queue);
        dump.systemSettings = await fetchAll(SystemSetting);

        logger.info('Exporting Association data...');
        // Note: For associations that are not direct models but through tables, 
        // we might need to handle them if they are defined as models.
        // In our models/index.js, they are imported.
        
        const fetchThrough = async (model) => {
            try {
                return await fetchAll(model);
            } catch (e) {
                logger.warn(`Could not export through-table ${model.name}: ${e.message}`);
                return [];
            }
        };

        dump.rolePermissions = await fetchThrough(RolePermission);
        dump.categoryQueues = await fetchThrough(CategoryQueue);
        dump.workflowStepQueues = await fetchThrough(WorkflowStepQueue);
        dump.quaiQueues = await fetchThrough(QuaiQueue);
        dump.userSites = await fetchThrough(UserSite);
        dump.userQueues = await fetchThrough(UserQueue);

        // Export only the requested admin user
        logger.info('Filtering production users...');
        const users = await User.findAll({
            where: { username: 'LABELMANAGER' }
        });
        dump.users = users.map(u => u.toJSON());

        const outputPath = path.join(__dirname, '../seeders/production_data.json');
        fs.writeFileSync(outputPath, JSON.stringify(dump, null, 2));

        logger.info(`Export completed! Data saved to ${outputPath}`);
        process.exit(0);
    } catch (error) {
        logger.error('Export failed:', error);
        process.exit(1);
    }
}

exportData();
