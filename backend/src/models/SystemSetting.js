import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class SystemSetting extends Model { }

SystemSetting.init({
    settingId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    key: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('STRING', 'INTEGER', 'BOOLEAN', 'JSON', 'DECIMAL'),
        defaultValue: 'STRING',
        allowNull: false
    },
    scope: {
        type: DataTypes.ENUM('GLOBAL', 'COMPANY', 'SITE'),
        defaultValue: 'GLOBAL',
        allowNull: false
    },
    scopeId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID de l\'entité ciblée — NULL autorisé uniquement si scope=GLOBAL'
    },
    category: {
        type: DataTypes.STRING(100),
        defaultValue: 'GENERAL',
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(500)
    }
}, {
    sequelize,
    modelName: 'SystemSetting',
    tableName: 'SystemSetting',
    timestamps: true,
    underscored: false
});

export default SystemSetting;
