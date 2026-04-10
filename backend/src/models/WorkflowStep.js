// src/models/WorkflowStep.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class WorkflowStep extends Model {}

WorkflowStep.init({
  stepId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'stepId' // Maintain DB compatibility
  },
  workflowId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Workflow', key: 'workflowId' }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  stepCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'code' // Maintain DB compatibility while using camelCase in code
  },
  orderNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isActived: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  formConfig: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  isolationAfterRecalls: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  }
}, {
  sequelize,
  modelName: 'WorkflowStep',
  tableName: 'WorkflowStep',
  timestamps: true,
  hooks: {
    beforeValidate: (step) => {
      if (!step.stepCode && step.orderNumber && step.name) {
        step.stepCode = `STP_${step.orderNumber}_${step.name.toUpperCase().replace(/\s+/g, '_')}`;
      }
    }
  }
});

export default WorkflowStep;
