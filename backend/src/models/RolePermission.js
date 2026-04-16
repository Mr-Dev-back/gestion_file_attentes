import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class RolePermission extends Model { }

RolePermission.init({
    roleId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
            model: 'Role',
            key: 'roleId'
        }
    },
    permissionId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
            model: 'Permission',
            key: 'permissionId'
        }
    }
}, {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'RoleHasPermission',
    timestamps: false,
    underscored: false
});

export default RolePermission;
