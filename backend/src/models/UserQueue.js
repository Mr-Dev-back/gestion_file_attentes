import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class UserQueue extends Model { }

UserQueue.init({
    userId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
            model: 'User',
            key: 'userId'
        }
    },
    queueId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
            model: 'Queue',
            key: 'queueId'
        }
    }
}, {
    sequelize,
    modelName: 'UserQueue',
    tableName: 'UserQueue',
    timestamps: false,
    underscored: false
});

export default UserQueue;
