import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    sequelize, Resource, Action, Permission, Role, RolePermission,
    Company, Site, Queue, Category, CategoryQueue,
    Workflow, WorkflowStep, WorkflowTransition,
    QuaiParameter, QuaiQueue, WorkflowStepQueue,
    User, ModelHasRole, ModelHasPermission
} from '../src/models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'seeders', 'production_data.json');

async function exportData() {
    console.log('--- Starting Database Export to Seeder Format ---');
    
    try {
        const data = {};

        console.log('Fetching Resources...');
        data.resources = await Resource.findAll({ raw: true });

        console.log('Fetching Actions...');
        data.actions = await Action.findAll({ raw: true });

        console.log('Fetching Companies...');
        data.companies = await Company.findAll({ raw: true });

        console.log('Fetching Categories...');
        data.categories = await Category.findAll({ raw: true });

        console.log('Fetching Workflows...');
        data.workflows = await Workflow.findAll({ raw: true });

        console.log('Fetching Permissions...');
        data.permissions = await Permission.findAll({ raw: true });

        console.log('Fetching Roles...');
        data.roles = await Role.findAll({ raw: true });

        console.log('Fetching Sites...');
        data.sites = await Site.findAll({ raw: true });

        console.log('Fetching Workflow Steps...');
        data.workflowSteps = await WorkflowStep.findAll({ raw: true });

        console.log('Fetching Workflow Transitions...');
        data.workflowTransitions = await WorkflowTransition.findAll({ raw: true });

        console.log('Fetching Users...');
        data.users = await User.findAll({ raw: true });

        console.log('Fetching Quai Parameters...');
        data.quaiParameters = await QuaiParameter.findAll({ raw: true });

        console.log('Fetching Queues...');
        data.queues = await Queue.findAll({ raw: true });

        // Pivots
        console.log('Fetching Associations...');
        data.rolePermissions = await RolePermission.findAll({ raw: true });
        data.quaiQueues = await QuaiQueue.findAll({ raw: true });
        data.workflowStepQueues = await WorkflowStepQueue.findAll({ raw: true });
        data.categoryQueues = await CategoryQueue.findAll({ raw: true });
        data.modelHasRoles = await ModelHasRole.findAll({ raw: true });
        data.modelHasPermissions = await ModelHasPermission.findAll({ raw: true });

        console.log(`Exporting ${Object.values(data).reduce((acc, curr) => acc + curr.length, 0)} records...`);
        
        await fs.writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf8');
        
        console.log(`--- SUCCESS ---`);
        console.log(`File generated at: ${OUTPUT_PATH}`);
        process.exit(0);
    } catch (error) {
        console.error('--- ERROR ---');
        console.error(error);
        process.exit(1);
    }
}

exportData();
