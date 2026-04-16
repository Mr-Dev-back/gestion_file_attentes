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
    resourceType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Type de ressource (ex: Ticket, User, Role)'
    },
    resourceId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'ID de la ressource concernée'
    },
    oldValues: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'État avant modification'
    },
    newValues: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'État après modification'
    },
    ipAddress: {
        type: DataTypes.STRING(45)
    },
    userAgent: {
        type: DataTypes.STRING(255),
        allowNull: true
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
