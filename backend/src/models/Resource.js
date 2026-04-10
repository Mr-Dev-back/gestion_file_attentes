import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Resource extends Model { }

Resource.init({
    resourceId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Resource',
    tableName: 'Resource',
    timestamps: true,
    underscored: false
});

export default Resource;
