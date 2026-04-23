'use strict';

const { randomUUID } = require('crypto');
const { QueryTypes } = require('sequelize');

const DEFAULT_GUARD = 'api';

const RESOURCES = [
  { name: 'Utilisateurs', slug: 'USER', description: 'Gestion des comptes utilisateurs et profils' },
  { name: 'Roles & Permissions', slug: 'ROLE', description: 'Configuration des acces et droits' },
  { name: 'Tickets', slug: 'TICKET', description: 'Gestion des tickets de pesee et d exploitation' },
  { name: 'Files d attente', slug: 'QUEUE', description: 'Configuration des files de traitement' },
  { name: 'Sites', slug: 'SITE', description: 'Parametrage des sites physiques' },
  { name: 'Quais', slug: 'QUAI', description: 'Gestion des points de passage et terminaux' },
  { name: 'Rapports', slug: 'REPORT', description: 'Acces aux statistiques et exports' },
  { name: 'Workflows', slug: 'WORKFLOW', description: 'Configuration des parcours clients' },
  { name: 'Bornes', slug: 'BORNE', description: 'Gestion des bornes tactiles' },
  { name: 'Societes', slug: 'SOCIETES', description: 'Gestion des societes' },
  { name: 'Logs', slug: 'LOGS', description: 'Consultation et supervision des logs' }
];

const ACTIONS = [
  { name: 'Creer', slug: 'CREATE', description: 'Droit de creation' },
  { name: 'Lire', slug: 'READ', description: 'Droit de consultation' },
  { name: 'Modifier', slug: 'UPDATE', description: 'Droit de modification' },
  { name: 'Supprimer', slug: 'DELETE', description: 'Droit de suppression' },
  { name: 'Valider', slug: 'VALIDATE', description: 'Droit de validation' },
  { name: 'Transferer', slug: 'TRANSFER', description: 'Droit de transfert' },
  { name: 'Appeler', slug: 'CALL', description: 'Droit d appel' },
  { name: 'Imprimer', slug: 'PRINT', description: 'Droit d impression' }
];

const ROLE_DEFINITIONS = [
  {
    name: 'ADMINISTRATOR',
    scope: 'GLOBAL',
    description: 'Acces total systeme',
    permissions: ['*']
  },
  {
    name: 'MANAGER',
    scope: 'COMPANY',
    description: 'Pilotage societe',
    permissions: [
      'USER:READ',
      'ROLE:READ',
      'TICKET:READ',
      'TICKET:UPDATE',
      'TICKET:TRANSFER',
      'TICKET:PRINT',
      'QUEUE:READ',
      'SITE:READ',
      'QUAI:READ',
      'REPORT:READ',
      'REPORT:PRINT',
      'WORKFLOW:READ',
      'BORNE:READ',
      'SOCIETES:READ',
      'LOGS:READ'
    ]
  },
  {
    name: 'SUPERVISOR',
    scope: 'SITE',
    description: 'Gestionnaire de site',
    permissions: [
      'USER:READ',
      'TICKET:READ',
      'TICKET:UPDATE',
      'TICKET:VALIDATE',
      'TICKET:TRANSFER',
      'TICKET:CALL',
      'TICKET:PRINT',
      'QUEUE:READ',
      'QUEUE:UPDATE',
      'SITE:READ',
      'QUAI:READ',
      'QUAI:UPDATE',
      'REPORT:READ',
      'LOGS:READ'
    ]
  },
  {
    name: 'AGENT_QUAI',
    scope: 'SITE',
    description: 'Operateur de quai',
    permissions: [
      'TICKET:READ',
      'TICKET:UPDATE',
      'TICKET:VALIDATE',
      'TICKET:CALL',
      'TICKET:PRINT',
      'QUEUE:READ',
      'QUAI:READ'
    ]
  },
  {
    name: 'AGENT_GUERITE',
    scope: 'SITE',
    description: 'Operateur guerite',
    permissions: [
      'TICKET:CREATE',
      'TICKET:READ',
      'TICKET:PRINT',
      'QUEUE:READ',
      'SITE:READ'
    ]
  }
];

const toSubjectName = (value) =>
  value
    .toLowerCase()
    .split(/[_:\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    const now = new Date();

    try {
      const existingResources = await queryInterface.sequelize.query(
        'SELECT "resourceId", slug FROM "Resource"',
        { transaction, type: QueryTypes.SELECT }
      );

      const existingResourceSlugs = new Set(existingResources.map((resource) => resource.slug));
      const resourcesToInsert = RESOURCES
        .filter((resource) => !existingResourceSlugs.has(resource.slug))
        .map((resource) => ({
          resourceId: randomUUID(),
          ...resource,
          createdAt: now,
          updatedAt: now
        }));

      if (resourcesToInsert.length > 0) {
        await queryInterface.bulkInsert('Resource', resourcesToInsert, { transaction });
      }

      const resources = await queryInterface.sequelize.query(
        'SELECT "resourceId", slug, name FROM "Resource"',
        { transaction, type: QueryTypes.SELECT }
      );
      const resourceBySlug = new Map(resources.map((resource) => [resource.slug, resource]));

      const existingActions = await queryInterface.sequelize.query(
        'SELECT "actionId", slug FROM "Action"',
        { transaction, type: QueryTypes.SELECT }
      );

      const existingActionSlugs = new Set(existingActions.map((action) => action.slug));
      const actionsToInsert = ACTIONS
        .filter((action) => !existingActionSlugs.has(action.slug))
        .map((action) => ({
          actionId: randomUUID(),
          ...action,
          createdAt: now,
          updatedAt: now
        }));

      if (actionsToInsert.length > 0) {
        await queryInterface.bulkInsert('Action', actionsToInsert, { transaction });
      }

      const actions = await queryInterface.sequelize.query(
        'SELECT "actionId", slug, name FROM "Action"',
        { transaction, type: QueryTypes.SELECT }
      );
      const actionBySlug = new Map(actions.map((action) => [action.slug, action]));

      const permissionBlueprints = [];
      RESOURCES.forEach((resource) => {
        ACTIONS.forEach((action) => {
          const code = `${resource.slug}:${action.slug}`.toUpperCase();
          permissionBlueprints.push({
            permissionId: randomUUID(),
            name: code,
            guard_name: DEFAULT_GUARD,
            code,
            description: `${action.name} ${resource.name}`.trim(),
            action: action.slug.toLowerCase(),
            subject: toSubjectName(resource.slug),
            resourceId: resourceBySlug.get(resource.slug)?.resourceId || null,
            actionId: actionBySlug.get(action.slug)?.actionId || null,
            createdAt: now,
            updatedAt: now
          });
        });
      });

      const existingPermissions = await queryInterface.sequelize.query(
        'SELECT "permissionId", code FROM permissions',
        { transaction, type: QueryTypes.SELECT }
      );
      const existingPermissionCodes = new Set(existingPermissions.map((permission) => permission.code));

      const permissionsToInsert = permissionBlueprints.filter(
        (permission) => !existingPermissionCodes.has(permission.code)
      );

      if (permissionsToInsert.length > 0) {
        await queryInterface.bulkInsert('permissions', permissionsToInsert, { transaction });
      }

      const permissions = await queryInterface.sequelize.query(
        'SELECT "permissionId", code FROM permissions',
        { transaction, type: QueryTypes.SELECT }
      );
      const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission]));

      const existingRoles = await queryInterface.sequelize.query(
        'SELECT "roleId", name FROM roles',
        { transaction, type: QueryTypes.SELECT }
      );
      const existingRoleNames = new Set(existingRoles.map((role) => role.name));

      const rolesToInsert = ROLE_DEFINITIONS
        .filter((role) => !existingRoleNames.has(role.name))
        .map((role) => ({
          roleId: randomUUID(),
          name: role.name,
          guard_name: DEFAULT_GUARD,
          description: role.description,
          scope: role.scope,
          createdAt: now,
          updatedAt: now
        }));

      if (rolesToInsert.length > 0) {
        await queryInterface.bulkInsert('roles', rolesToInsert, { transaction });
      }

      const roles = await queryInterface.sequelize.query(
        'SELECT "roleId", name FROM roles WHERE name IN (:names)',
        {
          transaction,
          type: QueryTypes.SELECT,
          replacements: { names: ROLE_DEFINITIONS.map((role) => role.name) }
        }
      );
      const roleByName = new Map(roles.map((role) => [role.name, role]));

      const seededRoleIds = roles.map((role) => role.roleId);
      if (seededRoleIds.length > 0) {
        await queryInterface.bulkDelete('role_has_permissions', { role_id: seededRoleIds }, { transaction });
      }

      const pivotRows = [];
      ROLE_DEFINITIONS.forEach((role) => {
        const resolvedRole = roleByName.get(role.name);
        if (!resolvedRole) {
          return;
        }

        const permissionCodes =
          role.permissions.includes('*')
            ? Array.from(permissionByCode.keys())
            : role.permissions;

        permissionCodes.forEach((code) => {
          const permission = permissionByCode.get(code);
          if (!permission) {
            return;
          }

          pivotRows.push({
            role_id: resolvedRole.roleId,
            permission_id: permission.permissionId
          });
        });
      });

      if (pivotRows.length > 0) {
        await queryInterface.bulkInsert('role_has_permissions', pivotRows, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const roleNames = ROLE_DEFINITIONS.map((role) => role.name);
      const permissionCodes = RESOURCES.flatMap((resource) =>
        ACTIONS.map((action) => `${resource.slug}:${action.slug}`.toUpperCase())
      );

      const roles = await queryInterface.sequelize.query(
        'SELECT "roleId" FROM roles WHERE name = ANY(:names)',
        {
          transaction,
          type: QueryTypes.SELECT,
          replacements: { names: roleNames }
        }
      );

      if (roles.length > 0) {
        await queryInterface.bulkDelete(
          'role_has_permissions',
          { role_id: roles.map((role) => role.roleId) },
          { transaction }
        );
      }

      await queryInterface.bulkDelete('roles', { name: roleNames }, { transaction });
      await queryInterface.bulkDelete('permissions', { code: permissionCodes }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
