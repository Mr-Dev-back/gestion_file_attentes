import { Permission, Role, User } from '../models/index.js';
import logger from '../config/logger.js';
import bcrypt from 'bcrypt';

const PERMISSIONS = [
    // User Management
    { code: 'user:read', resource: 'user', action: 'read', description: 'View users' },
    { code: 'user:create', resource: 'user', action: 'create', description: 'Create users' },
    { code: 'user:update', resource: 'user', action: 'update', description: 'Update users' },
    { code: 'user:delete', resource: 'user', action: 'delete', description: 'Delete users' },

    // Ticket Management
    { code: 'ticket:read', resource: 'ticket', action: 'read', description: 'View tickets' },
    { code: 'ticket:create', resource: 'ticket', action: 'create', description: 'Create tickets' },
    { code: 'ticket:update', resource: 'ticket', action: 'update', description: 'Update ticket details' },
    { code: 'ticket:status', resource: 'ticket', action: 'status', description: 'Change ticket status' },
    { code: 'ticket:delete', resource: 'ticket', action: 'delete', description: 'Delete tickets' },

    // Queue Management
    { code: 'queue:read', resource: 'queue', action: 'read', description: 'View queue status' },
    { code: 'queue:manage', resource: 'queue', action: 'manage', description: 'Manage queue (priority, call)' },

    // Configuration / References
    { code: 'config:read', resource: 'config', action: 'read', description: 'View system configuration' },
    { code: 'config:update', resource: 'config', action: 'update', description: 'Update system configuration' },
    { code: 'reference:read', resource: 'reference', action: 'read', description: 'View reference data (sites, categories)' },
    { code: 'reference:manage', resource: 'reference', action: 'manage', description: 'Manage reference data' },
];

const ROLES = [
    {
        name: 'ADMINISTRATOR',
        description: 'Global Administrator',
        scope: 'GLOBAL',
        permissions: ['*'] // Wildcard logic to be handled or mapping all
    },
    {
        name: 'SUPERVISOR',
        description: 'Site Supervisor',
        scope: 'SITE',
        permissions: ['ticket:*', 'queue:*', 'user:read', 'reference:read']
    },
    {
        name: 'MANAGER',
        description: 'Company/Site Manager',
        scope: 'COMPANY',
        permissions: ['ticket:read', 'queue:read', 'report:read', 'user:read']
    },
    {
        name: 'AGENT_QUAI',
        description: 'Dock Agent',
        scope: 'SITE',
        permissions: ['ticket:read', 'ticket:status', 'queue:read', 'queue:manage']
    },
    {
        name: 'AGENT_GUERITE',
        description: 'Gate Agent',
        scope: 'SITE',
        permissions: ['ticket:create', 'ticket:read', 'queue:read']
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
            username: 'admin',
            email: 'admin@sibm.ci',
            password: 'Admin123!',
            roleName: 'ADMINISTRATOR',
            firstName: 'System',
            lastName: 'Admin'
        },
        {
            username: 'agentquai',
            email: 'quai@sibm.ci',
            password: 'Admin123!',
            roleName: 'AGENT_QUAI',
            firstName: 'Jean',
            lastName: 'Quai'
        },
        {
            username: 'agentsales',
            email: 'sales@sibm.ci',
            password: 'Admin123!',
            roleName: 'AGENT_QUAI',
            firstName: 'Marie',
            lastName: 'Vente'
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
