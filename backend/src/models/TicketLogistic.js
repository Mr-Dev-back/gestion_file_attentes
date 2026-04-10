import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class TicketLogistic extends Model { }

TicketLogistic.init({
    ticketId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'Ticket', key: 'ticketId' }
    },
    orderNumber: {
        type: DataTypes.STRING(100)
    },
    salesPerson: {
        type: DataTypes.STRING(255)
    },
    qrCode: {
        type: DataTypes.TEXT
    },
    printedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    grossWeight: {
        type: DataTypes.FLOAT,
        allowNull: true,
        bgComment: 'Poids Brut (kg)'
    },
    tareWeight: {
        type: DataTypes.FLOAT,
        allowNull: true,
        bgComment: 'Poids Tare (kg)'
    },
    netWeight: {
        type: DataTypes.FLOAT,
        allowNull: true,
        bgComment: 'Poids Net (kg)'
    },
    plannedQuantity: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Quantité prévue (kg ou unités)'
    },
    loadedQuantity: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Quantité chargée réelle'
    },
    loadingInstructions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    loadingStartedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    loadingEndedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'TicketLogistic',
    tableName: 'TicketLogistic',
    timestamps: false,
    underscored: false
});

export default TicketLogistic;
