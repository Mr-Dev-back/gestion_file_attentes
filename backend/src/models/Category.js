import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Category extends Model { }

Category.init({
    categoryId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    prefix: { type: DataTypes.STRING(10), allowNull: false, unique: true },
    color: { type: DataTypes.STRING(20) },
    estimatedDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 30
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, { sequelize, modelName: 'Category', tableName: 'Category' });

export default Category;
