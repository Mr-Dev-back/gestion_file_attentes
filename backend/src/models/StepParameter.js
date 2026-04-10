import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class StepParameter extends Model {}

StepParameter.init({
  stepParameterId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  stepId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'WorkflowStep', key: 'stepId' }
  },
  quaiId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'QuaiConfig', key: 'quaiId' }
  },
  formConfig: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'StepParameter',
  tableName: 'StepParameter',
  timestamps: true
});

export default StepParameter;
