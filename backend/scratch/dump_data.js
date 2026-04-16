import fs from 'fs';
import {
    sequelize, User, Role, Permission, Resource, Action, 
    Company, Site, Queue, Category, Workflow, WorkflowStep, 
    WorkflowTransition, QuaiParameter, QuaiConfig, SystemSetting,
    RolePermission, CategoryQueue, QuaiQueue, WorkflowStepQueue, UserSite, UserQueue
} from '../src/models/index.js';

async function dump() {
    try {
        const counts = {
            Resources: await Resource.count(),
            Actions: await Action.count(),
            Permissions: await Permission.count(),
            Roles: await Role.count(),
            Companies: await Company.count(),
            Sites: await Site.count(),
            Queues: await Queue.count(),
            Categories: await Category.count(),
            Workflows: await Workflow.count(),
            WorkflowSteps: await WorkflowStep.count(),
            WorkflowTransitions: await WorkflowTransition.count(),
            QuaiParameters: await QuaiParameter.count(),
            QuaiConfigs: await QuaiConfig.count(),
            SystemSettings: await SystemSetting.count(),
            Users: await User.count()
        };
        console.log('Table Counts:', JSON.stringify(counts, null, 2));

        // Fetch data for small reference tables
        const data = {
            resources: await Resource.findAll({ raw: true }),
            actions: await Action.findAll({ raw: true }),
            permissions: await Permission.findAll({ raw: true }),
            roles: await Role.findAll({ raw: true }),
            rolePermissions: await RolePermission.findAll({ raw: true }),
            categoryQueues: await CategoryQueue.findAll({ raw: true }),
            quaiQueues: await QuaiQueue.findAll({ raw: true }),
            workflowStepQueues: await WorkflowStepQueue.findAll({ raw: true }),
            userSites: await UserSite.findAll({ raw: true }),
            userQueues: await UserQueue.findAll({ raw: true }),
            companies: await Company.findAll({ raw: true }),
            sites: await Site.findAll({ raw: true }),
            queues: await Queue.findAll({ raw: true }),
            categories: await Category.findAll({ raw: true }),
            workflows: await Workflow.findAll({ raw: true }),
            workflowSteps: await WorkflowStep.findAll({ raw: true }),
            workflowTransitions: await WorkflowTransition.findAll({ raw: true }),
            quaiParameters: await QuaiParameter.findAll({ raw: true }),
            quaiConfigs: await QuaiConfig.findAll({ raw: true }),
            systemSettings: await SystemSetting.findAll({ raw: true }),
            users: await User.findAll({ raw: true })
        };
        
        // Actually, we might need hashes for users if they want to reuse accounts.
        data.users = await User.findAll({ raw: true });

        fs.writeFileSync('scratch/dump.json', JSON.stringify(data, null, 2));
        console.log('Data dumped to scratch/dump.json');
        process.exit(0);
    } catch (error) {
        console.error('Dump Error:', error);
        process.exit(1);
    }
}

dump();
