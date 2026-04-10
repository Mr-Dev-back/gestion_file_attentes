import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class TicketActionLog extends Model { }

TicketActionLog.init({
    logId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    ticketId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Ticket', key: 'ticketId' }
    },
    stepId: {
        type: DataTypes.UUID,
        references: { model: 'WorkflowStep', key: 'stepId' }
    },
    actionType: {
        type: DataTypes.ENUM(
            'APPEL', 'RAPPEL', 'COMMENCER', 'TERMINER', 'ISOLER', 'PESEE_ENTREE', 'PESEE_SORTIE', 'IMPRESSION', 'TRANSFERE', 'PRIORITY_SET', 'ANNULER'
        ),
        allowNull: false
    },
    agentId: {
        type: DataTypes.UUID,
        references: { model: 'User', key: 'userId' }
    },
    quaiId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    formData: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    occurredAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'TicketActionLog',
    tableName: 'TicketActionLog',
    timestamps: false,
    underscored: false
});

export default TicketActionLog;
