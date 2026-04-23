const { Role, Permission, RolePermission } = await import('../models/index.js');
import logger from '../config/logger.js';

async function seedAgentPolyvalent() {
    try {
        console.log('--- SEEDING AGENT POLYVALENT ---');

        // 1. Création ou récupération du rôle
        const [role] = await Role.findOrCreate({
            where: { name: 'AGENT_POLYVALENT' },
            defaults: {
                description: 'Agent capable de gérer plusieurs files d\'attente simultanément.',
                scope: 'SITE'
            }
        });

        // 2. Création de la permission spéciale multi-quais
        // On utilise l'action 'manage' sur le sujet 'Ticket'
        const [permission] = await Permission.findOrCreate({
            where: { code: 'TICKET:MANAGE_MULTI' },
            defaults: {
                action: 'manage',
                subject: 'Ticket',
                description: 'Droit de gérer les tickets de plusieurs files d\'attente',
                conditions: {
                    queueId: { $in: '${user.assignedQueueIds}' }
                }
            }
        });

        // 3. Association du rôle et de la permission
        // Note: Le modèle Sequelize s'appelle RolePermission (la table est RoleHasPermission)
        await RolePermission.findOrCreate({
            where: {
                roleId: role.roleId,
                permissionId: permission.permissionId
            }
        });

        console.log('--- SEEDING RÉUSSI : Rôle AGENT_POLYVALENT prêt ---');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors du seeding:', error);
        process.exit(1);
    }
}

seedAgentPolyvalent();
