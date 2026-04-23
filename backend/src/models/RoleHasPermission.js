import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class RoleHasPermission extends Model {}

RoleHasPermission.init({
  roleId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    field: 'role_id',
    references: {
      model: 'roles',
      key: 'roleId'
    }
  },
  permissionId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    field: 'permission_id',
    references: {
      model: 'permissions',
      key: 'permissionId'
    }
  }
}, {
  sequelize,
  modelName: 'RoleHasPermission',
  tableName: 'role_has_permissions',
  timestamps: false,
  underscored: true
});

export default RoleHasPermission;
