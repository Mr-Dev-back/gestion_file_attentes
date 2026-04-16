import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class UserRole extends Model { }

UserRole.init({
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'User',
            key: 'userId'
        },
        primaryKey: true
    },
    roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Role',
            key: 'roleId'
        },
        primaryKey: true
    }
}, {
    sequelize,
    modelName: 'UserRole',
    tableName: 'UserRole',
    timestamps: true,
    underscored: false
});

export default UserRole;
