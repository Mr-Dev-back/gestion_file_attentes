// src/models/TicketStep.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class TicketStep extends Model {}

TicketStep.init({
  ticketStepID: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'ticketStepId'
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Ticket', key: 'ticketId' }
  },
  stepId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'WorkflowStep', key: 'stepId' }
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isIsolated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'TicketStep',
  tableName: 'TicketStep',
  timestamps: true
});

export default TicketStep;
