import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class RefreshToken extends Model {
    static async verifyExpiration(token) {
        return token.expiresAt.getTime() < new Date().getTime();
    }
}

RefreshToken.init({
    id: {
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
        type: DataTypes.TEXT,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    isRevoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'RefreshToken',
    timestamps: true, // Doit être à true
    updatedAt: 'updatedAt', // Assure-toi que ce n'est pas à false
    createdAt: 'createdAt'
});

export default RefreshToken;
