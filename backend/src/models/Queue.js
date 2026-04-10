// src/models/Queue.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Queue extends Model {}

Queue.init({
    queueId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    isActived: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'Category', key: 'categoryId' }
    },
    stepId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'WorkflowStep', key: 'stepId' }
    },
    quaiId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'QuaiParameter', key: 'quaiId' }
    }
}, {
    sequelize,
    modelName: 'Queue',
    tableName: 'Queue',
    timestamps: true
});

export default Queue;