// src/models/QuaiParameter.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class QuaiParameter extends Model {}

QuaiParameter.init({
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
    allowNull: true,
    references: { model: 'Site', key: 'siteId' }
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Category', key: 'categoryId' }
  },
  stepId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'WorkflowStep', key: 'stepId' }
  },
  expectedStepCode: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  formConfig: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  allowedUsers: {
    type: DataTypes.JSONB,
    defaultValue: [] // Array of userIDs
  }
}, {
  sequelize,
  modelName: 'QuaiParameter',
  tableName: 'QuaiParameter',
  timestamps: true
});

export default QuaiParameter;
