import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import {
  Company,
  LoginHistory,
  ModelHasPermission,
  ModelHasRole,
  Queue,
  RefreshToken,
  Role,
  Site,
  User,
  UserPasswordReset,
  UserQueue,
  UserSite,
  sequelize
} from '../models/index.js';
import auditService from '../services/auditService.js';
import logger from '../config/logger.js';

const userListInclude = [
  {
    model: Role,
    as: 'roles',
    attributes: ['roleId', 'name', 'guardName'],
    through: { attributes: [] }
  },
  {
    model: Role,
    as: 'assignedRole',
    attributes: ['roleId', 'name', 'guardName']
  },
  {
    model: Site,
    as: 'site',
    attributes: ['siteId', 'name'],
    include: [{ model: Company, as: 'company', attributes: ['companyId', 'name'] }]
  },
  {
    model: Company,
    as: 'company',
    attributes: ['companyId', 'name']
  },
  {
    model: Queue,
    as: 'queue',
    attributes: ['queueId', 'name']
  },
  {
    model: Queue,
    as: 'queues',
    attributes: ['queueId', 'name'],
    through: { attributes: [] }
  }
];

const syncPrimaryRole = async (user, role, transaction) => {
  const roleIds = role ? [role.roleId] : [];
  await user.setRoles(roleIds, { transaction });
  await user.update({ roleId: role?.roleId || null }, { transaction });
};

class UserController {
  async createUser(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { username, email, password, role, siteId, companyId, queueId, queueIds, firstName, lastName } = req.body;
      const normEmail = email ? email.trim().toLowerCase() : null;
      const normUsername = username ? username.trim() : null;

      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email: normEmail }, { username: normUsername }]
        },
        transaction
      });

      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Cet email ou nom d\'utilisateur est déjà utilisé.' });
      }

      const roleObj = role ? await Role.findOne({ where: { name: role }, transaction }) : null;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        username: normUsername,
        email: normEmail,
        password: hashedPassword,
        roleId: roleObj?.roleId || null,
        siteId: siteId || null,
        companyId: companyId || null,
        assignedQueueId: queueId || null,
        firstName: firstName || null,
        lastName: lastName || null,
        isActive: true
      }, { transaction });

      await syncPrimaryRole(user, roleObj, transaction);

      const targetQueueIds = queueIds || (queueId ? [queueId] : []);
      if (targetQueueIds.length > 0) {
        await user.setQueues(targetQueueIds, { transaction });
      }

      await auditService.logAction(req, 'CREATE_USER', 'User', user.userId, null, {
        username: user.username,
        email: user.email,
        role
      });

      await transaction.commit();

      const persistedUser = await User.findByPk(user.userId, {
        attributes: { exclude: ['password'] },
        include: userListInclude
      });

      res.status(201).json({
        message: 'Utilisateur créé avec succès.',
        user: persistedUser
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Erreur creation utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur.' });
    }
  }

  async getAllUsers(req, res) {
    try {
      const { page, limit, search } = req.query;
      const where = {};

      if (search) {
        where[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const queryOptions = {
        where,
        attributes: { exclude: ['password'] },
        include: userListInclude,
        order: [['createdAt', 'DESC']]
      };

      if (page && limit) {
        queryOptions.limit = parseInt(limit, 10);
        queryOptions.offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const { count, rows } = await User.findAndCountAll(queryOptions);
        return res.status(200).json({
          total: count,
          pages: Math.ceil(count / parseInt(limit, 10)),
          currentPage: parseInt(page, 10),
          data: rows
        });
      }

      const users = await User.findAll(queryOptions);
      res.status(200).json(users);
    } catch (error) {
      logger.error('Erreur récupération utilisateurs:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs.' });
    }
  }

  async getUserById(req, res) {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] },
        include: userListInclude
      });

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé.' });
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUser(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { username, email, role, siteId, companyId, queueId, queueIds, isActive, password, firstName, lastName } = req.body;
      const user = await User.findByPk(req.params.id, { transaction });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Utilisateur non trouvé.' });
      }

      const normEmail = email ? email.trim().toLowerCase() : null;
      const normUsername = username ? username.trim() : null;

      if ((normEmail && normEmail !== user.email) || (normUsername && normUsername !== user.username)) {
        const conditions = [];
        if (normEmail && normEmail !== user.email) {
          conditions.push({ email: normEmail, userId: { [Op.ne]: user.userId } });
        }
        if (normUsername && normUsername !== user.username) {
          conditions.push({ username: normUsername, userId: { [Op.ne]: user.userId } });
        }

        if (conditions.length > 0) {
          const existingUser = await User.findOne({ where: { [Op.or]: conditions }, transaction });
          if (existingUser) {
            await transaction.rollback();
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
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;

      let roleObj = null;
      if (role !== undefined) {
        roleObj = role ? await Role.findOne({ where: { name: role }, transaction }) : null;
        updates.roleId = roleObj?.roleId || null;
      }

      if (password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(password, salt);
      }

      const oldData = { ...user.toJSON() };
      await user.update(updates, { transaction });

      if (role !== undefined) {
        await syncPrimaryRole(user, roleObj, transaction);
      }

      const targetQueueIds = queueIds || (queueId !== undefined ? (queueId ? [queueId] : []) : undefined);
      if (targetQueueIds !== undefined) {
        await user.setQueues(targetQueueIds, { transaction });
      }

      const diff = auditService.getDiff(oldData, updates);
      if (diff) {
        await auditService.logAction(req, 'UPDATE_USER', 'User', user.userId, diff.old, diff.new);
      }

      await transaction.commit();

      const persistedUser = await User.findByPk(user.userId, {
        attributes: { exclude: ['password'] },
        include: userListInclude
      });

      res.status(200).json({
        message: 'Utilisateur mis à jour avec succès.',
        user: persistedUser
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Erreur mise à jour utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur.' });
    }
  }

  async deleteUser(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(req.params.id, { transaction });
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Utilisateur non trouvé.' });
      }

      const modelWhere = { modelType: 'User', modelId: user.userId };

      await UserSite.destroy({ where: { userId: user.userId }, transaction });
      await RefreshToken.destroy({ where: { userId: user.userId }, transaction });
      await UserPasswordReset.destroy({ where: { userId: user.userId }, transaction });
      await LoginHistory.destroy({ where: { userId: user.userId }, transaction });
      await UserQueue.destroy({ where: { userId: user.userId }, transaction });
      await ModelHasRole.destroy({ where: modelWhere, transaction });
      await ModelHasPermission.destroy({ where: modelWhere, transaction });

      await auditService.logAction(req, 'DELETE_USER', 'User', user.userId, { email: user.email, username: user.username });
      await user.destroy({ transaction });

      await transaction.commit();
      res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
    } catch (error) {
      await transaction.rollback();
      logger.error('Erreur lors de la suppression de l\'utilisateur:', error);
      res.status(500).json({ error: error.message });
    }
  }

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

  async bulkUpdateStatus(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { ids, isActive } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Une liste d\'IDs est requise.' });
      }

      await User.update(
        { isActive },
        {
          where: { userId: { [Op.in]: ids } },
          transaction
        }
      );

      await auditService.logAction(req, 'BULK_UPDATE_USER_STATUS', 'User', 'MULTIPLE', null, {
        count: ids.length,
        isActive,
        userIds: ids
      });

      await transaction.commit();
      res.status(200).json({ message: `${ids.length} utilisateurs mis à jour.` });
    } catch (error) {
      await transaction.rollback();
      logger.error('Erreur bulk update status users:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour groupée.' });
    }
  }

  async bulkDeleteUsers(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Une liste d\'IDs est requise.' });
      }

      const userWhere = { userId: { [Op.in]: ids } };
      const modelWhere = { modelType: 'User', modelId: { [Op.in]: ids } };

      await UserSite.destroy({ where: userWhere, transaction });
      await RefreshToken.destroy({ where: userWhere, transaction });
      await UserPasswordReset.destroy({ where: userWhere, transaction });
      await LoginHistory.destroy({ where: userWhere, transaction });
      await UserQueue.destroy({ where: userWhere, transaction });
      await ModelHasRole.destroy({ where: modelWhere, transaction });
      await ModelHasPermission.destroy({ where: modelWhere, transaction });
      await User.destroy({ where: userWhere, transaction });

      await auditService.logAction(req, 'BULK_DELETE_USERS', 'User', 'MULTIPLE', null, {
        count: ids.length,
        userIds: ids
      });

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
