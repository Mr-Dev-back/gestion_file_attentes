import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcrypt';

class User extends Model {
    async validatePassword(password) {
        return await bcrypt.compare(password, this.password);
    }
}

User.init({
    userId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    id: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.userId;
        }
    },
    queueId: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.assignedQueueId;
        }
    },
    role: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.assignedRole?.name || null;
        }
    },
    roleId: {
        type: DataTypes.UUID,
        references: { model: 'Role', key: 'roleId' }
    },
    siteId: {
      type: DataTypes.UUID,
      references: { model: 'Site', key: 'siteId' }
    },
    companyId: {
        type: DataTypes.UUID,
        references: { model: 'Company', key: 'companyId' }
    },
    assignedQueueId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Queue', key: 'queueId' }
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING(100)
    },
    lastName: {
        type: DataTypes.STRING(100)
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    failedAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lockUntil: {
        type: DataTypes.DATE
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'User',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    underscored: false
});

export default User;
