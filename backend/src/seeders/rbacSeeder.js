import { Permission, Role, User } from '../models/index.js';
import logger from '../config/logger.js';
import bcrypt from 'bcrypt';

const PERMISSIONS = [
    // 1. User Management (ADMIN)
    { code: 'user:read', resource: 'user', action: 'read', description: 'Consulter les utilisateurs' },
    { code: 'user:create', resource: 'user', action: 'create', description: 'Créer des comptes' },
    { code: 'user:update', resource: 'user', action: 'update', description: 'Modifier/Suspendre des comptes' },
    { code: 'user:delete', resource: 'user', action: 'delete', description: 'Supprimer des comptes' },

    // 2. System Configuration (ADMIN)
    { code: 'config:read', resource: 'config', action: 'read', description: 'Consulter les paramètres' },
    { code: 'config:update', resource: 'config', action: 'update', description: 'Modifier les paramètres globaux' },
    
    // 3. Workflow Architecture (ADMIN)
    { code: 'workflow:manage', resource: 'workflow', action: 'manage', description: 'Gérer les étapes et transitions' },

    // 4. Maintenance & Audit (ADMIN/MANAGER)
    { code: 'audit:read', resource: 'audit', action: 'read', description: 'Consulter les logs audit' },
    { code: 'audit:full', resource: 'audit', action: 'full', description: 'Accès complet aux logs et backups' },

    // 5. Analytics (MANAGER/ADMIN)
    { code: 'dashboard:read', resource: 'dashboard', action: 'read', description: 'Accès aux statistiques temps réel' },
    { code: 'report:export', resource: 'report', action: 'export', description: 'Générer des exports de performance' },

    // 6. Ticket Operations (SUPERVISOR/AGENT)
    { code: 'ticket:read', resource: 'ticket', action: 'read', description: 'Visualiser l\'état des tickets' },
    { code: 'ticket:search', resource: 'ticket', action: 'search', description: 'Rechercher par matricule' },
    { code: 'ticket:status', resource: 'ticket', action: 'status', description: 'Changer l\'étape ou annuler' },
    { code: 'ticket:update', resource: 'ticket', action: 'update', description: 'Saisir des données (poids, chargement)' },
    
    // 7. Queue Operations (SUPERVISOR/AGENT)
    { code: 'queue:read', resource: 'queue', action: 'read', description: 'Voir sa file d\'attente' },
    { code: 'queue:manage', resource: 'queue', action: 'manage', description: 'Réordonner les priorités' },
];

const ROLES = [
    {
        name: 'ADMINISTRATOR',
        description: 'Accès total et destructif sur le système',
        scope: 'GLOBAL',
        permissions: ['*'] 
    },
    {
        name: 'MANAGER',
        description: 'Rôle analytique et surveillance de performance',
        scope: 'COMPANY',
        permissions: [
            'dashboard:read', 
            'report:export', 
            'audit:read', 
            'ticket:read'
        ]
    },
    {
        name: 'SUPERVISOR',
        description: 'Régulateur du site et intervention opérationnelle',
        scope: 'SITE',
        permissions: [
            'ticket:read', 
            'ticket:search', 
            'ticket:status', 
            'queue:read', 
            'queue:manage', 
            'ticket:update'
        ]
    },
    {
        name: 'AGENT_QUAI',
        description: 'Opérations zone d\'affectation (Bascule/Parc/Contrôle/Vente)',
        scope: 'SITE',
        permissions: [
            'queue:read', 
            'ticket:read',
            'ticket:search',
            'ticket:status', 
            'ticket:update',
            'dashboard:read'
        ]
    },
    {
        name: 'AGENT_GUERITE',
        description: 'Opérations d\'accueil / contrôle à la guérite',
        scope: 'SITE',
        permissions: [
            'queue:read',
            'ticket:read',
            'ticket:status',
            'ticket:update'
        ]
    },
    {
        name: 'EXPLOITATION',
        description: 'Rôle exploitation (supervision opérationnelle élargie)',
        scope: 'SITE',
        permissions: [
            'dashboard:read',
            'audit:read',
            'ticket:read',
            'ticket:search',
            'ticket:status',
            'ticket:update',
            'queue:read',
            'queue:manage'
        ]
    }
];

export const seedRBAC = async () => {
    logger.info('Starting RBAC seeding...');

    // 1. Seed Permissions
    const permissionMap = {};
    for (const p of PERMISSIONS) {
        const [perm, created] = await Permission.findOrCreate({
            where: { code: p.code },
            defaults: p
        });
        permissionMap[p.code] = perm;
        if (created) logger.info(`Created permission: ${p.code}`);
    }

    // 2. Seed Roles & Assign Permissions
    for (const r of ROLES) {
        const [role, created] = await Role.findOrCreate({
            where: { name: r.name },
            defaults: {
                description: r.description,
                scope: r.scope
            }
        });

        if (created) logger.info(`Created role: ${r.name}`);

        // Logic to resolve permissions
        const permsToAssign = [];
        if (r.permissions.includes('*')) {
            // Assign ALL permissions
            Object.values(permissionMap).forEach(p => permsToAssign.push(p));
        } else {
            r.permissions.forEach(pCode => {
                if (pCode.endsWith(':*')) {
                    // Wildcard resource (e.g. ticket:*)
                    const resource = pCode.split(':')[0];
                    Object.values(permissionMap).filter(p => p.resource === resource).forEach(p => permsToAssign.push(p));
                } else if (permissionMap[pCode]) {
                    permsToAssign.push(permissionMap[pCode]);
                }
            });
        }

        // Use setPermissions to replace existing associations or addPermissions to append
        if (permsToAssign.length > 0) {
            await role.setPermissions(permsToAssign); // Requires Role.belongsToMany(Permission) association
            logger.info(`Assigned ${permsToAssign.length} permissions to role ${r.name}`);
        }
    }

    // 3. Create Test Users
    logger.info('Creating test users...');
    const testUsers = [
        {
            username: 'LABELMANAGER',
            email: 'info.dsi@sibmci.com',
            password: 'SIBMlab@2026!', // À changer par la DSI au premier login
            roleName: 'ADMINISTRATOR',
            firstName: 'ADMIN',
            lastName: 'DSI'
        }
    ];

    for (const testUser of testUsers) {
        const role = await Role.findOne({ where: { name: testUser.roleName } });
        if (role) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(testUser.password, salt);

            const [user, created] = await User.findOrCreate({
                where: { username: testUser.username },
                defaults: {
                    email: testUser.email,
                    password: hashedPassword,
                    firstName: testUser.firstName,
                    lastName: testUser.lastName,
                    roleId: role.roleId, // Updated to roleId
                    isActive: true
                }
            });
            if (created) {
                logger.info(`Created test user: ${testUser.username}`);
            } else {
                // Ensure role/password are updated for deterministic test credentials.
                user.roleId = role.roleId; // Updated to roleId
                user.password = hashedPassword;
                await user.save();
                logger.info(`Updated test user: ${testUser.username}`);
            }
        }
    }
};
