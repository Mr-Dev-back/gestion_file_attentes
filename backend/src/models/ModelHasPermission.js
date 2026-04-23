import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class ModelHasPermission extends Model {}

ModelHasPermission.init({
  permissionId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    field: 'permission_id',
    references: {
      model: 'permissions',
      key: 'permissionId'
    }
  },
  modelType: {
    type: DataTypes.STRING(150),
    allowNull: false,
    primaryKey: true,
    field: 'model_type',
    defaultValue: 'User'
  },
  modelId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    field: 'model_id'
  }
}, {
  sequelize,
  modelName: 'ModelHasPermission',
  tableName: 'model_has_permissions',
  timestamps: false,
  underscored: true
});

export default ModelHasPermission;
