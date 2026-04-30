import { Resource, Action, Permission, Role, RolePermission } from '../models/index.js';
import logger from '../config/logger.js';

async function seedAnalytics() {
    try {
        console.log('--- SEEDING ANALYTICS PERMISSIONS ---');

        // 1. Ressources
        const [resAnalytics] = await Resource.findOrCreate({
            where: { slug: 'ANALYTICS' },
            defaults: { name: 'Analytics & Dashboards', description: 'Accès aux statistiques et rapports pilotage' }
        });

        const [resGlobal] = await Resource.findOrCreate({
            where: { slug: 'GLOBAL_STATS' },
            defaults: { name: 'Statistiques Globales', description: 'Vue consolidée inter-sites' }
        });

        // 2. Actions
        const [actionRead] = await Action.findOrCreate({
            where: { slug: 'READ' },
            defaults: { name: 'Lire', description: 'Droit de lecture seule' }
        });

        const [actionManage] = await Action.findOrCreate({
            where: { slug: 'MANAGE' },
            defaults: { name: 'Gérer', description: 'Droit de gestion totale' }
        });

        // 3. Permissions
        // Permission Analytics (Site scoped)
        const [permAnalytics] = await Permission.findOrCreate({
            where: { code: 'ANALYTICS:READ' },
            defaults: {
                action: 'read',
                subject: 'Analytics',
                description: 'Droit de lecture des analytics du site',
                resourceId: resAnalytics.resourceId,
                actionId: actionRead.actionId,
                conditions: { siteId: "${user.siteId}" }
            }
        });

        // Permission Global Stats
        const [permGlobal] = await Permission.findOrCreate({
            where: { code: 'ANALYTICS:GLOBAL' },
            defaults: {
                action: 'read',
                subject: 'GlobalStats',
                description: 'Droit de lecture des stats globales inter-sites',
                resourceId: resGlobal.resourceId,
                actionId: actionRead.actionId
            }
        });

        // 4. Assignation aux Rôles
        const managerRole = await Role.findOne({ where: { name: 'MANAGER' } });
        const supervisorRole = await Role.findOne({ where: { name: 'SUPERVISOR' } });
        const adminRole = await Role.findOne({ where: { name: 'ADMINISTRATOR' } });

        if (managerRole) {
            await RolePermission.findOrCreate({
                where: { roleId: managerRole.roleId, permissionId: permAnalytics.permissionId }
            });
        }

        if (supervisorRole) {
            await RolePermission.findOrCreate({
                where: { roleId: supervisorRole.roleId, permissionId: permAnalytics.permissionId }
            });
        }

        if (adminRole) {
            await RolePermission.findOrCreate({
                where: { roleId: adminRole.roleId, permissionId: permAnalytics.permissionId }
            });
            await RolePermission.findOrCreate({
                where: { roleId: adminRole.roleId, permissionId: permGlobal.permissionId }
            });
        }

        console.log('--- SEEDING RÉUSSI : Analytics & GlobalStats configurés ---');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors du seeding:', error);
        process.exit(1);
    }
}

seedAnalytics();
