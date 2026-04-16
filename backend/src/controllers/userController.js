import { User, Role, Site, Company, Queue, RefreshToken, RolePermission, LoginHistory, UserSite, UserQueue, UserPasswordReset, sequelize } from '../models/index.js';
import auditService from '../services/auditService.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';
import bcrypt from 'bcrypt';

class UserController {
    /**
     * Créer un nouvel utilisateur
     */
    async createUser(req, res) {
        try {
            const { username, email, password, role, siteId, companyId, queueId, queueIds, firstName, lastName } = req.body;

            // Normalisation
            const normEmail = email ? email.trim().toLowerCase() : null;
            const normUsername = username ? username.trim() : null;

            const existingUser = await User.findOne({ 
                where: { 
                    [Op.or]: [
                        { email: normEmail },
                        { username: normUsername }
                    ]
                } 
            });
            if (existingUser) {
                return res.status(400).json({ error: 'Cet email ou nom d\'utilisateur est déjà utilisé.' });
            }

            let roleId = null;
            if (role) {
                const roleObj = await Role.findOne({ where: { name: role } });
                if (roleObj) roleId = roleObj.roleId;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = await User.create({
                username: normUsername,
                email: normEmail,
                password: hashedPassword,
                roleId: roleId,
                siteId: siteId || null,
                companyId: companyId || null,
                assignedQueueId: queueId || null,
                firstName: firstName || null,
                lastName: lastName || null,
                isActive: true
            });

            // Handle Multi-queue association
            const targetQueueIds = queueIds || (queueId ? [queueId] : []);
            if (targetQueueIds.length > 0) {
                await user.setQueues(targetQueueIds);
            }

            await auditService.logAction(req, 'CREATE_USER', 'User', user.userId, null, { 
                username: user.username, 
                email: user.email, 
                role 
            });

            res.status(201).json({
                message: 'Utilisateur créé avec succès.',
                user: {
                    id: user.userId,
                    username: user.username,
                    email: user.email,
                    role: role
                }
            });
        } catch (error) {
            logger.error('Erreur creation utilisateur:', error);
            res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur.' });
        }
    }

    /**
     * Récupérer tous les utilisateurs
     */
    async getAllUsers(req, res) {
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password'] },
                include: [
                    {
                        model: Role,
                        as: 'roles',
                        attributes: ['name']
                    },
                    {
                        model: Site,
                        as: 'site',
                        attributes: ['name'],
                        include: [{ model: Company, as: 'company', attributes: ['name'] }]
                    },
                    {
                        model: Company,
                        as: 'company',
                        attributes: ['name']
                    },
                    {
                        model: Queue,
                        as: 'queue',
                        attributes: ['name']
                    },
                    {
                        model: Queue,
                        as: 'queues',
                        attributes: ['queueId', 'name'],
                        through: { attributes: [] }
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            res.status(200).json(users);
        } catch (error) {
            logger.error('Erreur récupération utilisateurs:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs.' });
        }
    }

    /**
     * Récupérer un utilisateur par ID
     */
    async getUserById(req, res) {
        try {
            const user = await User.findByPk(req.params.id, {
                attributes: { exclude: ['password'] },
                include: [
                    { model: Role, as: 'roles', attributes: ['name'] },
                    { model: Site, as: 'site', attributes: ['name'], include: [{ model: Company, as: 'company', attributes: ['name'] }] },
                    { model: Company, as: 'company', attributes: ['name'] },
                    { model: Queue, as: 'queue', attributes: ['name'] },
                    {
                        model: Queue,
                        as: 'queues',
                        attributes: ['queueId', 'name'],
                        through: { attributes: [] }
                    }
                ]
            });
            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé.' });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Mettre à jour un utilisateur
     */
    async updateUser(req, res) {
        try {
            const { username, email, role, siteId, companyId, queueId, queueIds, isActive, password, firstName, lastName } = req.body;
            const user = await User.findByPk(req.params.id);

            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé.' });
            }

            // Normalisation
            const normEmail = email ? email.trim().toLowerCase() : null;
            const normUsername = username ? username.trim() : null;

            logger.info(`[UPDATE USER] ID: ${req.params.id}, Email: ${normEmail}, Username: ${normUsername}`);

            // Check if email or username is already taken by another user
            if ((normEmail && normEmail !== user.email) || (normUsername && normUsername !== user.username)) {
                const conditions = [];
                if (normEmail && normEmail !== user.email) conditions.push({ email: normEmail, userId: { [Op.ne]: user.userId } });
                if (normUsername && normUsername !== user.username) conditions.push({ username: normUsername, userId: { [Op.ne]: user.userId } });
                
                if (conditions.length > 0) {
                    const existingUser = await User.findOne({ where: { [Op.or]: conditions } });
                    if (existingUser) {
                        logger.warn(`[UPDATE USER] Duplicate detected: ${existingUser.email} or ${existingUser.username}`);
                        return res.status(400).json({ error: 'Cet email ou nom d\'utilisateur est déjà utilisé.' });
                    }
                }
            }

            const updates = {};
            if (normUsername) updates.username = normUsername;
            if (normEmail) updates.email = normEmail;
            if (siteId !== undefined) updates.siteId = siteId;
            if (companyId !== undefined) updates.companyId = companyId;
            if (queueId !== undefined) updates.assignedQueueId = queueId;
            if (isActive !== undefined) updates.isActive = isActive;
            if (firstName) updates.firstName = firstName;
            if (lastName) updates.lastName = lastName;
            
            if (role) {
                const roleObj = await Role.findOne({ where: { name: role } });
                if (roleObj) updates.roleId = roleObj.roleId;
            }
            
            if (password) {
                const salt = await bcrypt.genSalt(10);
                updates.password = await bcrypt.hash(password, salt);
            }

            const oldData = { ...user.toJSON() };
            await user.update(updates);

            // Sync Multi-queues if provided
            const targetQueueIds = queueIds || (queueId !== undefined ? (queueId ? [queueId] : []) : undefined);
            if (targetQueueIds !== undefined) {
                await user.setQueues(targetQueueIds);
            }

            const diff = auditService.getDiff(oldData, updates);
            if (diff) {
                await auditService.logAction(req, 'UPDATE_USER', 'User', user.userId, diff.old, diff.new);
            }

            res.status(200).json({
                message: 'Utilisateur mis à jour avec succès.',
                user: {
                    id: user.userId,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: role,
                    isActive: user.isActive
                }
            });
        } catch (error) {
            logger.error('Erreur mise à jour utilisateur:', error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur.' });
        }
    }

    /**
     * Supprimer un utilisateur
     */
    async deleteUser(req, res) {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé.' });
            }

            // Manually delete junction records and support tables that might block deletion
            // especially if DB constraints are missing CASCADE behavior
            await UserSite.destroy({ where: { userId: user.userId } });
            await RefreshToken.destroy({ where: { userId: user.userId } });
            await UserPasswordReset.destroy({ where: { userId: user.userId } });
            await LoginHistory.destroy({ where: { userId: user.userId } });
            await UserQueue.destroy({ where: { userId: user.userId } });

            await auditService.logAction(req, 'DELETE_USER', 'User', user.userId, { email: user.email, username: user.username });

            await user.destroy();
            res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
        } catch (error) {
            logger.error('Erreur lors de la suppression de l\'utilisateur:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Débloquer un utilisateur
     */
    async unlockUser(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findByPk(id);

            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé.' });
            }

            await user.update({
                failedAttempts: 0,
                lockUntil: null
            });

            await auditService.logAction(req, 'UNLOCK_USER', 'User', id);

            res.status(200).json({ message: 'Utilisateur débloqué avec succès.' });
        } catch (error) {
            logger.error('Erreur déblocage utilisateur:', error);
            res.status(500).json({ error: 'Erreur lors du déblocage de l\'utilisateur.' });
        }
    }

    /**
     * Récupérer les sessions actives (Refresh Tokens) d'un utilisateur
     */
    async getUserSessions(req, res) {
        try {
            const { id } = req.params;
            const sessions = await RefreshToken.findAll({
                where: {
                    userId: id,
                    isRevoked: false,
                    expiresAt: { [Op.gt]: new Date() }
                },
                order: [['expiresAt', 'DESC']]
            });
            res.status(200).json(sessions);
        } catch (error) {
            logger.error('Erreur récupération sessions:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des sessions actives.' });
        }
    }

    /**
     * Révoquer une session spécifique
     */
    async revokeSession(req, res) {
        try {
            const { sessionId } = req.params;
            const session = await RefreshToken.findByPk(sessionId);

            if (!session) {
                return res.status(404).json({ error: 'Session non trouvée.' });
            }

            await session.update({ isRevoked: true });
            res.status(200).json({ message: 'Session révoquée avec succès.' });
        } catch (error) {
            logger.error('Erreur révocation session:', error);
            res.status(500).json({ error: 'Erreur lors de la révocation de la session.' });
        }
    }

    /**
     * Récupérer l'historique des connexions d'un utilisateur
     */
    async getLoginHistory(req, res) {
        try {
            const { id } = req.params;
            const history = await LoginHistory.findAll({
                where: { userId: id },
                order: [['createdAt', 'DESC']],
                limit: 50
            });
            res.status(200).json(history);
        } catch (error) {
            logger.error('Erreur récupération historique login:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique.' });
        }
    }

    /**
     * Mise à jour groupée du statut (Activer/Désactiver)
     */
    async bulkUpdateStatus(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { ids, isActive } = req.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'Une liste d\'IDs est requise.' });
            }

            await User.update(
                { isActive },
                { 
                    where: { userId: { [Op.in]: ids } },
                    transaction 
                }
            );

            await auditService.logAction(req, 'BULK_UPDATE_USER_STATUS', 'User', 'MULTIPLE', null, { count: ids.length, isActive, userIds: ids });

            await transaction.commit();
            res.status(200).json({ message: `${ids.length} utilisateurs mis à jour.` });
        } catch (error) {
            await transaction.rollback();
            logger.error('Erreur bulk update status users:', error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour groupée.' });
        }
    }

    /**
     * Suppression groupée d'utilisateurs
     */
    async bulkDeleteUsers(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { ids } = req.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'Une liste d\'IDs est requise.' });
            }

            // Nettoyage des tables liées pour tous les utilisateurs
            const where = { userId: { [Op.in]: ids } };
            await UserSite.destroy({ where, transaction });
            await RefreshToken.destroy({ where, transaction });
            await UserPasswordReset.destroy({ where, transaction });
            await LoginHistory.destroy({ where, transaction });
            await UserQueue.destroy({ where, transaction });

            await User.destroy({ where, transaction });

            await auditService.logAction(req, 'BULK_DELETE_USERS', 'User', 'MULTIPLE', null, { count: ids.length, userIds: ids });

            await transaction.commit();
            res.status(200).json({ message: `${ids.length} utilisateurs supprimés.` });
        } catch (error) {
            await transaction.rollback();
            logger.error('Erreur bulk delete users:', error);
            res.status(500).json({ error: 'Erreur lors de la suppression groupée.' });
        }
    }
}

export default new UserController();
