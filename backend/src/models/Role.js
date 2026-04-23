import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Role extends Model {}

Role.init({
  roleId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  guardName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'api',
    field: 'guard_name'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  scope: {
    type: DataTypes.ENUM('GLOBAL', 'COMPANY', 'SITE', 'QUAI'),
    defaultValue: 'SITE',
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Role',
  tableName: 'roles',
  timestamps: true,
  underscored: false,
  indexes: [
    {
      unique: true,
      fields: ['name', 'guard_name'],
      name: 'roles_name_guard_name_unique'
    }
  ]
});

export default Role;
