import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class LoginHistory extends Model { }

LoginHistory.init({
    loginHistoryId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'User', key: 'userId' }
    },
    ipAddress: {
        type: DataTypes.INET
    },
    userAgent: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.ENUM('SUCCESS', 'FAILED', 'LOCKED', 'MFA_REQUIRED'),
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'LoginHistory',
    tableName: 'LoginHistory',
    timestamps: true,
    underscored: false
});

export default LoginHistory;
