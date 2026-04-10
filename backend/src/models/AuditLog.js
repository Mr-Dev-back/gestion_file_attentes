import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class AuditLog extends Model { }

AuditLog.init({
    auditId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'User', key: 'userId' }
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    details: {
        type: DataTypes.JSONB
    },
    ipAddress: {
        type: DataTypes.STRING(45)
    },
    occurredAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'AuditLog',
    timestamps: false,
    underscored: false
});

export default AuditLog;
