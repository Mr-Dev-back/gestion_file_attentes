import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Ticket extends Model { }

Ticket.init({
    ticketId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    ticketNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    siteId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Site', key: 'siteId' }
    },
    categoryId: {
        type: DataTypes.UUID,
        references: { model: 'Category', key: 'categoryId' }
    },
    currentStepId: {
        type: DataTypes.UUID,
        references: { model: 'WorkflowStep', key: 'stepId' }
    },
    status: {
        type: DataTypes.ENUM(
            'EN_ATTENTE', 'APPELE', 'CALLING', 'EN_TRAITEMENT', 'PROCESSING', 'ISOLE', 'TRANSFERE', 'COMPLETE', 'ANNULE'
        ),
        defaultValue: 'EN_ATTENTE'
    },
    driverName: {
        type: DataTypes.STRING(100)
    },
    driverPhone: {
        type: DataTypes.STRING(20)
    },
    licensePlate: {
        type: DataTypes.STRING(20)
    },
    orderNumber: {
        type: DataTypes.STRING(50)
    },
    companyName: {
        type: DataTypes.STRING(100)
    },
    weightIn: {
        type: DataTypes.DECIMAL(10, 2)
    },
    weightOut: {
        type: DataTypes.DECIMAL(10, 2)
    },
    priority: {
        type: DataTypes.SMALLINT,
        defaultValue: 0
    },
    priorityReason: {
        type: DataTypes.STRING(255)
    },
    recallCount: {
        type: DataTypes.SMALLINT,
        defaultValue: 0
    },
    arrivedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    calledAt: {
        type: DataTypes.DATE
    },
    startedAt: {
        type: DataTypes.DATE
    },
    completedAt: {
        type: DataTypes.DATE
    },
    calledBy: {
        type: DataTypes.UUID,
        references: { model: 'User', key: 'userId' }
    },
    quaiId: {
        type: DataTypes.UUID,
        references: { model: 'QuaiParameter', key: 'quaiId' }
    },
    queueId: {
        type: DataTypes.UUID,
        references: { model: 'Queue', key: 'queueId' }
    },
    isTransferred: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    modelName: 'Ticket',
    tableName: 'Ticket',
    timestamps: true,
    updatedAt: 'updatedAt',
    createdAt: false,
    underscored: false
});

export default Ticket;
