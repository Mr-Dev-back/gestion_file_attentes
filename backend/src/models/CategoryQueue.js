import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class CategoryQueue extends Model { }

CategoryQueue.init({
    categoryId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'Category', key: 'categoryId' }
    },
    queueId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'Queue', key: 'queueId' }
    },
    maxCapacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'NULL = capacité illimitée'
    }
}, {
    sequelize,
    modelName: 'CategoryQueue',
    tableName: 'CategoryQueue',
    timestamps: true,
    underscored: false
});

export default CategoryQueue;
