import bcrypt from 'bcrypt';
import { sequelize } from '../config/database.js';
import {
    Role, Permission, User, Company, Site,
    RolePermission, Category, Queue, Workflow, WorkflowStep
} from '../models/index.js';

async function seed() {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        console.log('--- Database Reset & Seeding (New Architecture) ---');
        
        // 0. Reset complet
        await sequelize.sync({ force: true });
        console.log('✓ Database schema reset.');

        // 1. Création des Permissions
        const permissions = await Permission.bulkCreate([
            { name: 'Appeler Ticket', code: 'TICKET_CALL', resource: 'QUEUE', action: 'MANAGE' },
            { name: 'Traiter Pesée', code: 'PROCESS_WEIGHING', resource: 'WEIGHING', action: 'PROCESS' },
            { name: 'Admin Système', code: 'ADMIN_ALL', resource: 'SYSTEM', action: 'MANAGE' }
        ], { transaction });

        // 2. Création des Rôles
        const adminRole = await Role.create({ name: 'ADMINISTRATOR', description: 'Accès total' }, { transaction });
        const agentRole = await Role.create({ name: 'AGENT_BALANCE', description: 'Opérateur Pont-Bascule' }, { transaction });

        await Promise.all(permissions.map(p => 
            RolePermission.create({ roleId: adminRole.roleId, permissionId: p.permissionId }, { transaction })
        ));

        // 3. Organisation
        const company = await Company.create({ name: 'SIBM', code: 'SIBM', email: 'contact@sibm.ci' }, { transaction });
        const site = await Site.create({ name: 'Site San Pedro', code: 'SSP', companyId: company.companyId }, { transaction });

        // 4. Catégories
        await Category.bulkCreate([
            { name: 'Granulats', prefix: 'G', color: '#3b82f6' },
            { name: 'Sable', prefix: 'S', color: '#f59e0b' }
        ], { transaction });

        // 5. Infrastructure Physique
        const queues = {
            SALES: await Queue.create({ name: 'Bureau des Ventes', siteId: site.siteId, type: 'Ventes' }, { transaction }),
            WEIGHING: await Queue.create({ name: 'Pont Bascule 1', siteId: site.siteId, type: 'Pesée' }, { transaction }),
            LOADING: await Queue.create({ name: 'Zone de Chargement', siteId: site.siteId, type: 'Chargement' }, { transaction })
        };

        // 6. Logique Métier
        const workflow = await Workflow.create({ 
            name: 'Standard SIBM', 
            description: 'Flux logistique granulats' 
        }, { transaction });

        // Assigner le workflow au site
        await site.update({ workflowId: workflow.workflowId }, { transaction });

        await WorkflowStep.bulkCreate([
            { 
                workflowId: workflow.workflowId, 
                queueId: queues.SALES.queueId, 
                name: 'Enregistrement', 
                stepCode: 'ENREGISTREMENT',
                orderNumber: 1, 
                formConfig: { fields: ['client_name', 'truck_plate'] } 
            },
            { 
                workflowId: workflow.workflowId, 
                queueId: queues.WEIGHING.queueId, 
                name: 'Pesée Entrée', 
                stepCode: 'PESEE_ENTREE',
                orderNumber: 2,
                formConfig: { fields: ['tare_weight'] } 
            },
            { 
                workflowId: workflow.workflowId, 
                queueId: queues.LOADING.queueId, 
                name: 'Chargement', 
                stepCode: 'CHARGEMENT',
                orderNumber: 3,
                formConfig: { fields: ['product_type'] } 
            },
            { 
                workflowId: workflow.workflowId, 
                queueId: queues.WEIGHING.queueId,
                name: 'Pesée Sortie', 
                stepCode: 'PESEE_SORTIE',
                orderNumber: 4, 
                formConfig: { fields: ['gross_weight'] } 
            }
        ], { transaction });

        // 7. Utilisateur Admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin123!', salt);
        await User.create({
            username: 'admin',
            email: 'admin@sibm.ci',
            password: hashedPassword,
            roleId: adminRole.roleId,
            siteId: site.siteId,
            isActive: true
        }, { transaction });

        await transaction.commit();
        console.log('✓ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

seed();
