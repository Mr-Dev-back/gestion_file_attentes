import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class WorkflowTransition extends Model { }

WorkflowTransition.init({
    transitionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    workflowId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Workflow',
            key: 'workflowId'
        }
    },
    fromStepId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'WorkflowStep',
            key: 'stepId'
        }
    },
    toStepId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'WorkflowStep',
            key: 'stepId'
        }
    },
    allowedRoles: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Roles autorisés à effectuer cette transition'
    },
    conditions: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: 'Conditions à remplir pour effectuer cette transition (ex: poids > 0)'
    }
}, {
    sequelize,
    modelName: 'WorkflowTransition',
    tableName: 'WorkflowTransition',
    timestamps: true,
    underscored: false
});

export default WorkflowTransition;
