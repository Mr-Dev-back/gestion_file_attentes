import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Company extends Model { }

Company.init({
    companyId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    code: {
        type: DataTypes.STRING(20),
        unique: true
    },
    isActived: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    sequelize,
    modelName: 'Company',
    tableName: 'Company',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false,
    underscored: false
});

export default Company;
