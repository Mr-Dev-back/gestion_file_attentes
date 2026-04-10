import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class QuaiQueue extends Model {}

QuaiQueue.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    quaiId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'QuaiParameter', key: 'quaiId' }
    },
    queueId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Queue', key: 'queueId' }
    }
}, {
    sequelize,
    modelName: 'QuaiQueue',
    tableName: 'QuaiQueue',
    timestamps: true
});

export default QuaiQueue;
