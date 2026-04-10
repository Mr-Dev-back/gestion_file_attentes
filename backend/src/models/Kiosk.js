import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Kiosk extends Model { }

Kiosk.init({
    kioskId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    siteId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Site', key: 'siteId' }
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    kioskType: {
        type: DataTypes.STRING(50),
        defaultValue: 'ENTRANCE'
    },
    status: {
        type: DataTypes.ENUM('ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'),
        defaultValue: 'OFFLINE'
    },
    ipAddress: {
        type: DataTypes.STRING(45)
    },
    macAddress: {
        type: DataTypes.STRING(17),
        unique: true
    },
    capabilities: {
        type: DataTypes.JSONB,
        defaultValue: { hasPrinter: true, hasScale: false }
    },
    lastPing: {
        type: DataTypes.DATE
    }
}, {
    sequelize,
    modelName: 'Kiosk',
    tableName: 'Kiosk',
    timestamps: false,
    underscored: false
});

export default Kiosk;
