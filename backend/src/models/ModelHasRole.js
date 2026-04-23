import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class ModelHasRole extends Model {}

ModelHasRole.init({
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
  modelName: 'ModelHasRole',
  tableName: 'model_has_roles',
  timestamps: false,
  underscored: true
});

export default ModelHasRole;
