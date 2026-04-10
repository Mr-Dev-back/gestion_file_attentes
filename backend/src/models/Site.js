import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Site extends Model { }

Site.init({
    siteId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    companyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Company', key: 'companyId' }
    },
    workflowId: {
        type: DataTypes.UUID,
        references: { model: 'Workflow', key: 'workflowId' }
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    code: {
        type: DataTypes.STRING(20),
        unique: true
    },
    address: {
        type: DataTypes.TEXT
    },
    alertThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 45
    },
    isActived: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    sequelize,
    modelName: 'Site',
    tableName: 'Site',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false,
    underscored: false
});

export default Site;
