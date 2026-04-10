import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class WorkflowStepQueue extends Model {}

WorkflowStepQueue.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    stepId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'WorkflowStep', key: 'stepId' }
    },
    queueId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Queue', key: 'queueId' }
    }
}, {
    sequelize,
    modelName: 'WorkflowStepQueue',
    tableName: 'WorkflowStepQueue',
    timestamps: true
});

export default WorkflowStepQueue;
