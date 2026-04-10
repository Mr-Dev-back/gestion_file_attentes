import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class KioskActivity extends Model { }

KioskActivity.init({
    kioskActivityId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    kioskId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Kiosk', key: 'kioskId' }
    },
    event: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    severity: {
        type: DataTypes.ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL'),
        defaultValue: 'INFO',
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'KioskActivity',
    tableName: 'KioskActivity',
    timestamps: true,
    underscored: false
});

export default KioskActivity;
