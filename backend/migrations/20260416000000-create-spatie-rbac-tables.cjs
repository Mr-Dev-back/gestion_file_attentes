'use strict';

const USER_MODEL_TYPE = 'User';
const DEFAULT_GUARD = 'api';

async function tableExists(queryInterface, tableName, transaction) {
  try {
    await queryInterface.describeTable(tableName, { transaction });
    return true;
  } catch {
    return false;
  }
}

async function columnExists(queryInterface, tableName, columnName, transaction) {
  try {
    const definition = await queryInterface.describeTable(tableName, { transaction });
    return Object.prototype.hasOwnProperty.call(definition, columnName);
  } catch {
    return false;
  }
}

async function ensureTable(queryInterface, tableName, columns, options, transaction) {
  if (!(await tableExists(queryInterface, tableName, transaction))) {
    await queryInterface.createTable(tableName, columns, { ...options, transaction });
  }
}

async function ensureColumn(queryInterface, tableName, columnName, definition, transaction) {
  if (!(await columnExists(queryInterface, tableName, columnName, transaction))) {
    await queryInterface.addColumn(tableName, columnName, definition, { transaction });
  }
}

async function renameTableIfNeeded(queryInterface, from, to, transaction) {
  if ((await tableExists(queryInterface, from, transaction)) && !(await tableExists(queryInterface, to, transaction))) {
    await queryInterface.renameTable(from, to, { transaction });
  }
}

async function renameColumnIfNeeded(queryInterface, tableName, from, to, transaction) {
  if ((await columnExists(queryInterface, tableName, from, transaction)) && !(await columnExists(queryInterface, tableName, to, transaction))) {
    await queryInterface.renameColumn(tableName, from, to, { transaction });
  }
}

async function ensureIndex(queryInterface, tableName, indexName, options, transaction) {
  const indexes = await queryInterface.showIndex(tableName, { transaction });
  if (!indexes.some((index) => index.name === indexName)) {
    await queryInterface.addIndex(tableName, options.fields, {
      ...options,
      name: indexName,
      transaction
    });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await renameTableIfNeeded(queryInterface, 'Role', 'roles', transaction);
      await renameTableIfNeeded(queryInterface, 'Permission', 'permissions', transaction);
      await renameTableIfNeeded(queryInterface, 'RoleHasPermission', 'role_has_permissions', transaction);

      await ensureTable(
        queryInterface,
        'roles',
        {
          roleId: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          name: {
            type: Sequelize.STRING(150),
            allowNull: false
          },
          guard_name: {
            type: Sequelize.STRING(100),
            allowNull: false,
            defaultValue: DEFAULT_GUARD
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          scope: {
            type: Sequelize.ENUM('GLOBAL', 'COMPANY', 'SITE', 'QUAI'),
            allowNull: false,
            defaultValue: 'SITE'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW')
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW')
          }
        },
        {},
        transaction
      );

      await renameColumnIfNeeded(queryInterface, 'roles', 'guardName', 'guard_name', transaction);
      await ensureColumn(
        queryInterface,
        'roles',
        'guard_name',
        {
          type: Sequelize.STRING(100),
          allowNull: false,
          defaultValue: DEFAULT_GUARD
        },
        transaction
      );
      await ensureColumn(
        queryInterface,
        'roles',
        'description',
        {
          type: Sequelize.TEXT,
          allowNull: true
        },
        transaction
      );
      await ensureColumn(
        queryInterface,
        'roles',
        'scope',
        {
          type: Sequelize.ENUM('GLOBAL', 'COMPANY', 'SITE', 'QUAI'),
          allowNull: false,
          defaultValue: 'SITE'
        },
        transaction
      );

      await ensureTable(
        queryInterface,
        'permissions',
        {
          permissionId: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          name: {
            type: Sequelize.STRING(191),
            allowNull: true
          },
          guard_name: {
            type: Sequelize.STRING(100),
            allowNull: false,
            defaultValue: DEFAULT_GUARD
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          code: {
            type: Sequelize.STRING(191),
            allowNull: true
          },
          action: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          subject: {
            type: Sequelize.STRING(150),
            allowNull: true
          },
          conditions: {
            type: Sequelize.JSONB,
            allowNull: true
          },
          resourceId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'Resource', key: 'resourceId' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          actionId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'Action', key: 'actionId' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW')
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW')
          }
        },
        {},
        transaction
      );

      await renameColumnIfNeeded(queryInterface, 'permissions', 'guardName', 'guard_name', transaction);
      await ensureColumn(
        queryInterface,
        'permissions',
        'name',
        {
          type: Sequelize.STRING(191),
          allowNull: true
        },
        transaction
      );
      await ensureColumn(
        queryInterface,
        'permissions',
        'guard_name',
        {
          type: Sequelize.STRING(100),
          allowNull: false,
          defaultValue: DEFAULT_GUARD
        },
        transaction
      );
      await ensureColumn(
        queryInterface,
        'permissions',
        'description',
        {
          type: Sequelize.TEXT,
          allowNull: true
        },
        transaction
      );
      await ensureColumn(
        queryInterface,
        'permissions',
        'code',
        {
          type: Sequelize.STRING(191),
          allowNull: true
        },
        transaction
      );
      await ensureColumn(
        queryInterface,
        'permissions',
        'action',
        {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        transaction
      );
      await ensureColumn(
        queryInterface,
        'permissions',
        'subject',
        {
          type: Sequelize.STRING(150),
          allowNull: true
        },
        transaction
      );
      await ensureColumn(
        queryInterface,
        'permissions',
        'conditions',
        {
          type: Sequelize.JSONB,
          allowNull: true
        },
        transaction
      );

      await ensureTable(
        queryInterface,
        'role_has_permissions',
        {
          role_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'roles', key: 'roleId' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          permission_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'permissions', key: 'permissionId' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          }
        },
        {},
        transaction
      );

      await renameColumnIfNeeded(queryInterface, 'role_has_permissions', 'roleId', 'role_id', transaction);
      await renameColumnIfNeeded(queryInterface, 'role_has_permissions', 'permissionId', 'permission_id', transaction);

      await ensureTable(
        queryInterface,
        'model_has_roles',
        {
          role_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'roles', key: 'roleId' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          model_type: {
            type: Sequelize.STRING(150),
            allowNull: false,
            defaultValue: USER_MODEL_TYPE
          },
          model_id: {
            type: Sequelize.UUID,
            allowNull: false
          }
        },
        {},
        transaction
      );

      await renameColumnIfNeeded(queryInterface, 'model_has_roles', 'roleId', 'role_id', transaction);
      await renameColumnIfNeeded(queryInterface, 'model_has_roles', 'modelType', 'model_type', transaction);
      await renameColumnIfNeeded(queryInterface, 'model_has_roles', 'modelId', 'model_id', transaction);

      await ensureTable(
        queryInterface,
        'model_has_permissions',
        {
          permission_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'permissions', key: 'permissionId' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          model_type: {
            type: Sequelize.STRING(150),
            allowNull: false,
            defaultValue: USER_MODEL_TYPE
          },
          model_id: {
            type: Sequelize.UUID,
            allowNull: false
          }
        },
        {},
        transaction
      );

      await renameColumnIfNeeded(queryInterface, 'model_has_permissions', 'permissionId', 'permission_id', transaction);
      await renameColumnIfNeeded(queryInterface, 'model_has_permissions', 'modelType', 'model_type', transaction);
      await renameColumnIfNeeded(queryInterface, 'model_has_permissions', 'modelId', 'model_id', transaction);

      await ensureColumn(
        queryInterface,
        'User',
        'roleId',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'roles', key: 'roleId' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        transaction
      );

      await ensureIndex(queryInterface, 'roles', 'roles_name_guard_name_unique', {
        unique: true,
        fields: ['name', 'guard_name']
      }, transaction);
      await ensureIndex(queryInterface, 'roles', 'roles_guard_name_index', {
        fields: ['guard_name']
      }, transaction);

      await ensureIndex(queryInterface, 'permissions', 'permissions_name_guard_name_unique', {
        unique: true,
        fields: ['name', 'guard_name']
      }, transaction);
      await ensureIndex(queryInterface, 'permissions', 'permissions_code_unique', {
        unique: true,
        fields: ['code']
      }, transaction);
      await ensureIndex(queryInterface, 'permissions', 'permissions_resource_action_unique', {
        unique: true,
        fields: ['resourceId', 'actionId']
      }, transaction);
      await ensureIndex(queryInterface, 'permissions', 'permissions_guard_name_index', {
        fields: ['guard_name']
      }, transaction);

      await ensureIndex(queryInterface, 'role_has_permissions', 'role_has_permissions_unique', {
        unique: true,
        fields: ['role_id', 'permission_id']
      }, transaction);
      await ensureIndex(queryInterface, 'role_has_permissions', 'role_has_permissions_permission_id_index', {
        fields: ['permission_id']
      }, transaction);

      await ensureIndex(queryInterface, 'model_has_roles', 'model_has_roles_unique', {
        unique: true,
        fields: ['model_id', 'model_type', 'role_id']
      }, transaction);
      await ensureIndex(queryInterface, 'model_has_roles', 'model_has_roles_role_id_index', {
        fields: ['role_id']
      }, transaction);
      await ensureIndex(queryInterface, 'model_has_roles', 'model_has_roles_lookup_index', {
        fields: ['model_type', 'model_id']
      }, transaction);

      await ensureIndex(queryInterface, 'model_has_permissions', 'model_has_permissions_unique', {
        unique: true,
        fields: ['model_id', 'model_type', 'permission_id']
      }, transaction);
      await ensureIndex(queryInterface, 'model_has_permissions', 'model_has_permissions_permission_id_index', {
        fields: ['permission_id']
      }, transaction);
      await ensureIndex(queryInterface, 'model_has_permissions', 'model_has_permissions_lookup_index', {
        fields: ['model_type', 'model_id']
      }, transaction);

      await ensureIndex(queryInterface, 'User', 'users_role_id_index', {
        fields: ['roleId']
      }, transaction);

      await queryInterface.sequelize.query(
        `
          UPDATE roles
          SET guard_name = COALESCE(NULLIF(guard_name, ''), :defaultGuard)
        `,
        {
          transaction,
          replacements: { defaultGuard: DEFAULT_GUARD }
        }
      );

      await queryInterface.sequelize.query(
        `
          UPDATE permissions p
          SET
            code = COALESCE(
              NULLIF(p.code, ''),
              (
                SELECT UPPER(CONCAT(r.slug, ':', a.slug))
                FROM "Resource" r
                JOIN "Action" a ON a."actionId" = p."actionId"
                WHERE r."resourceId" = p."resourceId"
                LIMIT 1
              ),
              CASE WHEN p.name IS NOT NULL THEN UPPER(p.name) ELSE NULL END
            ),
            name = COALESCE(
              NULLIF(p.name, ''),
              NULLIF(p.code, ''),
              (
                SELECT UPPER(CONCAT(r.slug, ':', a.slug))
                FROM "Resource" r
                JOIN "Action" a ON a."actionId" = p."actionId"
                WHERE r."resourceId" = p."resourceId"
                LIMIT 1
              ),
              CASE
                WHEN p.action IS NOT NULL AND p.subject IS NOT NULL THEN CONCAT(LOWER(p.subject), ':', LOWER(p.action))
                ELSE p."permissionId"::text
              END
            ),
            guard_name = COALESCE(NULLIF(p.guard_name, ''), :defaultGuard)
        `,
        {
          transaction,
          replacements: { defaultGuard: DEFAULT_GUARD }
        }
      );

      if (await tableExists(queryInterface, 'UserRole', transaction)) {
        await queryInterface.sequelize.query(
          `
            INSERT INTO model_has_roles (role_id, model_type, model_id)
            SELECT DISTINCT "roleId", :modelType, "userId"
            FROM "UserRole"
            WHERE "roleId" IS NOT NULL
            ON CONFLICT DO NOTHING
          `,
          {
            transaction,
            replacements: { modelType: USER_MODEL_TYPE }
          }
        );
      }

      if (await columnExists(queryInterface, 'User', 'roleId', transaction)) {
        await queryInterface.sequelize.query(
          `
            INSERT INTO model_has_roles (role_id, model_type, model_id)
            SELECT DISTINCT "roleId", :modelType, "userId"
            FROM "User"
            WHERE "roleId" IS NOT NULL
            ON CONFLICT DO NOTHING
          `,
          {
            transaction,
            replacements: { modelType: USER_MODEL_TYPE }
          }
        );

        await queryInterface.sequelize.query(
          `
            UPDATE "User" u
            SET "roleId" = src.role_id
            FROM (
              SELECT DISTINCT ON (model_id) model_id, role_id
              FROM model_has_roles
              WHERE model_type = :modelType
              ORDER BY model_id, role_id
            ) AS src
            WHERE u."userId" = src.model_id
              AND (u."roleId" IS NULL OR u."roleId" <> src.role_id)
          `,
          {
            transaction,
            replacements: { modelType: USER_MODEL_TYPE }
          }
        );
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
      if (await tableExists(queryInterface, 'model_has_permissions', transaction)) {
        await queryInterface.dropTable('model_has_permissions', { transaction });
      }

      if (await tableExists(queryInterface, 'model_has_roles', transaction)) {
        await queryInterface.dropTable('model_has_roles', { transaction });
      }

      if (await tableExists(queryInterface, 'role_has_permissions', transaction) && !(await tableExists(queryInterface, 'RoleHasPermission', transaction))) {
        await renameTableIfNeeded(queryInterface, 'role_has_permissions', 'RoleHasPermission', transaction);
      }

      if (await tableExists(queryInterface, 'permissions', transaction) && !(await tableExists(queryInterface, 'Permission', transaction))) {
        await renameTableIfNeeded(queryInterface, 'permissions', 'Permission', transaction);
      }

      if (await tableExists(queryInterface, 'roles', transaction) && !(await tableExists(queryInterface, 'Role', transaction))) {
        await renameTableIfNeeded(queryInterface, 'roles', 'Role', transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
