import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class UserSite extends Model { }

UserSite.init({
    userId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'User', key: 'userId' }
    },
    siteId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'Site', key: 'siteId' }
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'),
        defaultValue: 'ACTIVE',
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'UserSite',
    tableName: 'UserSite',
    timestamps: true,
    underscored: false
});

export default UserSite;
