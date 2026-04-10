import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Workflow extends Model { }

Workflow.init({
    workflowId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    isActived: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    sequelize,
    modelName: 'Workflow',
    tableName: 'Workflow',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false,
    underscored: false
});

export default Workflow;
