import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class KioskQueue extends Model { }

KioskQueue.init({
    kioskId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'Kiosk', key: 'kioskId' }
    },
    queueId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'Queue', key: 'queueId' }
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'KioskQueue',
    tableName: 'KioskQueue',
    timestamps: false,
    underscored: false
});

export default KioskQueue;
