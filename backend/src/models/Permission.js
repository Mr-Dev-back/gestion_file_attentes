import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

const DEFAULT_GUARD = 'api';

const toSubjectName = (value) => {
  if (!value) {
    return null;
  }

  return String(value)
    .toLowerCase()
    .split(/[_:\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
};

class Permission extends Model {}

Permission.init({
  permissionId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(191),
    allowNull: false
  },
  guardName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: DEFAULT_GUARD,
    field: 'guard_name'
  },
  code: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  subject: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  conditions: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Resource',
      key: 'resourceId'
    }
  },
  actionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Action',
      key: 'actionId'
    }
  }
}, {
  sequelize,
  modelName: 'Permission',
  tableName: 'permissions',
  timestamps: true,
  underscored: false,
  indexes: [
    {
      unique: true,
      fields: ['name', 'guard_name'],
      name: 'permissions_name_guard_name_unique'
    },
    {
      unique: true,
      fields: ['code'],
      name: 'permissions_code_unique'
    },
    {
      unique: true,
      fields: ['resourceId', 'actionId'],
      name: 'permissions_resource_action_unique'
    }
  ],
  hooks: {
    beforeValidate: async (permission, options) => {
      const Resource = sequelize.models.Resource;
      const Action = sequelize.models.Action;

      if (permission.resourceId && permission.actionId) {
        const [resource, action] = await Promise.all([
          Resource?.findByPk(permission.resourceId, { transaction: options.transaction }),
          Action?.findByPk(permission.actionId, { transaction: options.transaction })
        ]);

        if (resource && action) {
          permission.code = `${resource.slug}:${action.slug}`.toUpperCase();
          permission.name = permission.name || permission.code;
          permission.action = permission.action || String(action.slug).toLowerCase();
          permission.subject = permission.subject || toSubjectName(resource.slug);
        }
      }

      if (!permission.code && permission.name) {
        permission.code = String(permission.name).toUpperCase();
      }

      if (!permission.name && permission.code) {
        permission.name = permission.code;
      }

      if (!permission.subject && permission.code?.includes(':')) {
        permission.subject = toSubjectName(permission.code.split(':')[0]);
      }

      if (!permission.action && permission.code?.includes(':')) {
        permission.action = permission.code.split(':')[1]?.toLowerCase() || null;
      }

      permission.guardName = permission.guardName || DEFAULT_GUARD;
    }
  }
});

export default Permission;
