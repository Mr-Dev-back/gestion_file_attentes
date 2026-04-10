import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class TransitionAllowedRole extends Model { }

TransitionAllowedRole.init({
    transitionId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'WorkflowTransition', key: 'transitionId' }
    },
    roleId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'Role', key: 'roleId' }
    }
}, {
    sequelize,
    modelName: 'TransitionAllowedRole',
    tableName: 'TransitionAllowedRole',
    timestamps: false,
    underscored: false
});

export default TransitionAllowedRole;
