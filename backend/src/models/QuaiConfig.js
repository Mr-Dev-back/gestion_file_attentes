import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class QuaiConfig extends Model {}

QuaiConfig.init({
  quaiId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  label: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  siteId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Site', key: 'siteId' }
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Category', key: 'categoryId' }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'QuaiConfig',
  tableName: 'QuaiConfig',
  timestamps: true
});

export default QuaiConfig;
