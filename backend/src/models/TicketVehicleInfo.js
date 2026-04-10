import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class TicketVehicleInfo extends Model { }

TicketVehicleInfo.init({
    ticketId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'Ticket', key: 'ticketId' }
    },
    licensePlate: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    driverName: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    driverPhone: {
        type: DataTypes.STRING(30)
    },
    companyName: {
        type: DataTypes.STRING(255),
        comment: 'Snapshot — conservé même si l\'entreprise est renommée'
    }
}, {
    sequelize,
    modelName: 'TicketVehicleInfo',
    tableName: 'TicketVehicleInfo',
    timestamps: false,
    underscored: false
});

export default TicketVehicleInfo;
