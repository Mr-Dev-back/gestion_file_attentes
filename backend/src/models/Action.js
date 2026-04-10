import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Action extends Model { }

Action.init({
    actionId: {
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
    modelName: 'Action',
    tableName: 'Action',
    timestamps: true,
    underscored: false
});

export default Action;
