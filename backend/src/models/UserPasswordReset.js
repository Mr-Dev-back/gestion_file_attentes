import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class UserPasswordReset extends Model { }

UserPasswordReset.init({
    userPasswordResetId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'User', key: 'userId' }
    },
    token: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    usedAt: {
        type: DataTypes.DATE
    }
}, {
    sequelize,
    modelName: 'UserPasswordReset',
    tableName: 'UserPasswordReset',
    timestamps: true,
    underscored: false
});

export default UserPasswordReset;
