import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Permission extends Model { }

Permission.init({
    permissionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Foreign Keys to new tables
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
    tableName: 'Permission',
    timestamps: true,
    underscored: false,
    hooks: {
        beforeSave: async (permission, options) => {
            if (permission.resourceId && permission.actionId) {
                const Resource = sequelize.models.Resource;
                const Action = sequelize.models.Action;
                
                // Use transaction if provided in options
                const resource = await Resource.findByPk(permission.resourceId, { transaction: options.transaction });
                const action = await Action.findByPk(permission.actionId, { transaction: options.transaction });
                
                if (resource && action) {
                    permission.code = `${resource.slug}:${action.slug}`.toUpperCase();
                }
            }
        }
    }
});

export default Permission;
