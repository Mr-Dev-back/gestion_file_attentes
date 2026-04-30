import { sequelize, User, Role, Permission, UserRole } from '../models/index.js';
import logger from '../config/logger.js';

async function migrate() {
    console.log('--- DÉBUT DE LA MIGRATION CASL ---');
    const transaction = await sequelize.transaction();

    try {
        const queryInterface = sequelize.getQueryInterface();

        // 1. Mise à jour de la table Permission
        console.log('Vérification de la table Permission...');
        const permTable = await queryInterface.describeTable('Permission');
        
        if (!permTable.action) {
            console.log('Ajout de la colonne action...');
            await queryInterface.addColumn('Permission', 'action', { type: sequelize.Sequelize.STRING, allowNull: true }, { transaction });
        }
        if (!permTable.subject) {
            console.log('Ajout de la colonne subject...');
            await queryInterface.addColumn('Permission', 'subject', { type: sequelize.Sequelize.STRING, allowNull: true }, { transaction });
        }
        if (!permTable.conditions) {
            console.log('Ajout de la colonne conditions...');
            await queryInterface.addColumn('Permission', 'conditions', { type: sequelize.Sequelize.JSONB, allowNull: true }, { transaction });
        }

        // 2. Création de UserRole (user_has_roles)
        console.log('Vérification de la table UserRole...');
        try {
            await queryInterface.describeTable('UserRole');
            console.log('Table UserRole déjà existante.');
        } catch (e) {
            console.log('Création de la table UserRole...');
            await queryInterface.createTable('UserRole', {
                userId: {
                    type: sequelize.Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    references: { model: 'User', key: 'userId' },
                    onDelete: 'CASCADE'
                },
                roleId: {
                    type: sequelize.Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    references: { model: 'Role', key: 'roleId' },
                    onDelete: 'CASCADE'
                },
                createdAt: { type: sequelize.Sequelize.DATE, allowNull: false },
                updatedAt: { type: sequelize.Sequelize.DATE, allowNull: false }
            }, { transaction });
        }

        // 3. Migration des données de Permissions
        console.log('Migration des slugs vers action/subject...');
        const permissions = await Permission.findAll({ transaction });
        for (const perm of permissions) {
            if (perm.code && (!perm.action || !perm.subject)) {
                const parts = perm.code.split(':');
                if (parts.length === 2) {
                    const subject = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
                    const action = parts[1].toLowerCase();
                    await perm.update({ action, subject }, { transaction });
                }
            }
        }

        // 4. Migration des Rôles Utilisateurs
        console.log('Migration des roleId vers UserRole...');
        const userTable = await queryInterface.describeTable('User');
        if (userTable.roleId) {
            const users = await sequelize.query('SELECT "userId", "roleId" FROM "User" WHERE "roleId" IS NOT NULL', { 
                type: sequelize.QueryTypes.SELECT, 
                transaction 
            });
            
            for (const u of users) {
                // On vérifie si l'association existe déjà
                const existing = await UserRole.findOne({ 
                    where: { userId: u.userId, roleId: u.roleId },
                    transaction 
                });
                if (!existing) {
                    await UserRole.create({ 
                        userId: u.userId, 
                        roleId: u.roleId,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }, { transaction });
                }
            }
            
            console.log('Suppression de la colonne physique roleId dans User...');
            // Note: On le fait après avoir copié les données
            // await queryInterface.removeColumn('User', 'roleId', { transaction });
            // ATTENTION: Certaines bases PostgreSQL demandent de supprimer les contraintes avant.
            // On laisse la colonne pour l'instant (le modèle Sequelize utilisera le VIRTUAL quoi qu'il arrive)
        }

        await transaction.commit();
        console.log('--- MIGRATION RÉUSSIE ---');
        process.exit(0);
    } catch (error) {
        await transaction.rollback();
        console.error('--- ÉCHEC DE LA MIGRATION ---');
        console.error(error);
        process.exit(1);
    }
}

migrate();
