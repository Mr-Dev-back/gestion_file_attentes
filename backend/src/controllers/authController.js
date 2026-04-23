import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import {
  Company,
  Queue,
  RefreshToken,
  Role,
  Site,
  User,
  UserPasswordReset
} from '../models/index.js';
import logger from '../config/logger.js';
import {
  defineAbilitiesFor,
  extractPermissionNames,
  rbacUserAuthorizationInclude
} from '../config/ability.js';
import auditService from '../services/auditService.js';

const authUserInclude = [
  ...rbacUserAuthorizationInclude,
  {
    model: Site,
    as: 'site',
    include: [{ model: Company, as: 'company' }]
  },
  {
    model: Queue,
    as: 'queues',
    attributes: ['queueId', 'name', 'quaiId']
  },
  {
    model: Queue,
    as: 'queue',
    attributes: ['queueId', 'name', 'quaiId']
  },
  {
    model: Company,
    as: 'company'
  }
];

const syncPrimaryRole = async (user, role) => {
  const roleIds = role ? [role.roleId] : [];
  await user.setRoles(roleIds);

  if (user.roleId !== (role?.roleId || null)) {
    await user.update({ roleId: role?.roleId || null });
  }
};

const buildUserPayload = async (user) => {
  const response = user.toJSON();
  delete response.password;

  const permissions = await user.getAllPermissionNames();

  response.role = user.assignedRole?.name || user.roles?.[0]?.name || null;
  response.permissions = permissions;
  response.rules = defineAbilitiesFor(user).rules;

  return response;
};

class AuthController {
  async register(req, res) {
    try {
      const { username, email, password, role, firstName, lastName } = req.body;

      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { username }]
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Cet email ou nom d\'utilisateur est déjà utilisé.' });
      }

      const roleName = role || 'AGENT_QUAI';
      const roleObj = await Role.findOne({ where: { name: roleName } });
      if (!roleObj) {
        return res.status(400).json({ error: `Le rôle '${roleName}' n'existe pas.` });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isActive: true,
        roleId: roleObj.roleId
      });

      await syncPrimaryRole(user, roleObj);
      const createdUser = await User.findByPk(user.userId, { include: authUserInclude });

      res.status(201).json({
        message: 'Utilisateur créé avec succès.',
        user: await buildUserPayload(createdUser)
      });    } catch (error) {
      logger.error('Erreur inscription:', error);
      res.status(500).json({ error: 'Erreur lors de la création du compte.' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const normalizedEmail = (email || '').trim().toLowerCase();
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        logger.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
        return res.status(500).json({ error: 'Erreur de configuration serveur.' });
      }

      const user = await User.findOne({
        where: { email: normalizedEmail },
        include: authUserInclude
      });

      if (!user) {
        await auditService.logAction(req, 'LOGIN_FAILED', 'User', 'UNKNOWN', { email: normalizedEmail }, { reason: 'USER_NOT_FOUND' });
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      if (user.lockUntil && user.lockUntil > new Date()) {
        const waitTime = Math.ceil((user.lockUntil - new Date()) / 60000);
        return res.status(403).json({
          error: `Compte temporairement bloqué. Réessayez dans ${waitTime} minutes.`,
          code: 'ACCOUNT_LOCKED',
          lockUntil: user.lockUntil
        });
      }

      const isBcryptHash = typeof user.password === 'string' && /^\$2[aby]\$\d{2}\$/.test(user.password);
      let isValid = false;

      if (isBcryptHash) {
        isValid = await bcrypt.compare(password, user.password);
      } else {
        isValid = password === user.password;
        if (isValid) {
          const salt = await bcrypt.genSalt(10);
          await user.update({ password: await bcrypt.hash(password, salt) });
        }
      }

      if (!isValid) {
        const attempts = (user.failedAttempts || 0) + 1;
        let lockUntil = null;
        if (attempts >= 5) {
          lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        }

        await user.update({ failedAttempts: attempts, lockUntil });
        await auditService.logAction(req, 'LOGIN_FAILED', 'User', user.userId, { email: normalizedEmail }, { attempts });

        if (attempts >= 5) {
          return res.status(403).json({
            error: 'Compte bloqué suite à trop de tentatives. Réessayez dans 15min.',
            code: 'ACCOUNT_LOCKED',
            lockUntil
          });
        }

        return res.status(401).json({
          error: `Mot de passe incorrect. (${attempts}/5)`,
          attemptsRemaining: 5 - attempts
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          error: 'Votre compte est suspendu ou désactivé.',
          code: 'ACCOUNT_DISABLED'
        });
      }

      if ((!user.roles || user.roles.length === 0) && !user.assignedRole) {
        logger.warn(`Login attempt for user ${user.userId} failed: No role assigned.`);
        return res.status(403).json({
          error: "Votre compte n'a aucun rôle assigné. Contactez un administrateur.",
          code: 'NO_ROLE_ASSIGNED'
        });
      }

      await user.update({ failedAttempts: 0, lockUntil: null });
      await auditService.logAction(req, 'LOGIN_SUCCESS', 'User', user.userId);

      const primaryRole = user.assignedRole?.name || user.roles?.[0]?.name || null;

      const accessToken = jwt.sign(
        {
          id: user.userId,
          role: primaryRole,
          siteId: user.siteId,
          assignedQueueId: user.assignedQueueId
        },
        jwtSecret,
        { expiresIn: '1h' }
      );

      const refreshTokenStr = crypto.randomBytes(40).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await RefreshToken.create({
        userId: user.userId,
        token: refreshTokenStr,
        expiresAt,
        isRevoked: false
      });

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000
      });

      res.cookie('refreshToken', refreshTokenStr, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        message: 'Connexion réussie.',
        token: accessToken,
        user: await buildUserPayload(user)
      });
    } catch (error) {
      logger.error('Erreur login:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
    }
  }

  async refreshToken(req, res) {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
        return res.status(500).json({ error: 'Erreur de configuration serveur.' });
      }

      const tokenStr = req.cookies.refreshToken;
      if (!tokenStr) {
        return res.status(401).json({ error: 'Token manquant' });
      }

      const storedToken = await RefreshToken.findOne({
        where: {
          token: tokenStr,
          isRevoked: false,
          expiresAt: { [Op.gt]: new Date() }
        }
      });

      if (!storedToken) {
        return res.status(403).json({ error: 'Refresh token invalide ou expiré' });
      }

      const user = await User.findByPk(storedToken.userId, { include: authUserInclude });
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé.' });
      }

      const newAccessToken = jwt.sign(
        {
          id: user.userId,
          role: user.assignedRole?.name || user.roles?.[0]?.name || null,
          siteId: user.siteId,
          assignedQueueId: user.assignedQueueId
        },
        jwtSecret,
        { expiresIn: '1h' }
      );

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000
      });

      res.json({
        message: 'Token rafraîchi',
        token: newAccessToken
      });
    } catch (error) {
      logger.error('RefreshToken Error:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  async logout(req, res) {
    try {
      const tokenStr = req.cookies.refreshToken;
      if (tokenStr) {
        await RefreshToken.update({ isRevoked: true }, { where: { token: tokenStr } });
      }
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.json({ message: 'Déconnexion réussie' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }
  }

  async getMe(req, res) {
    try {
      const user = await User.findByPk(req.user.userId, {
        attributes: { exclude: ['password'] },
        include: authUserInclude
      });

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé.' });
      }

      res.status(200).json(await buildUserPayload(user));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(200).json({ message: 'Si ce compte existe, un email de réinitialisation a été envoyé.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000);

      await UserPasswordReset.create({
        userId: user.userId,
        token,
        expiresAt
      });

      logger.info(`Password reset requested for ${email}`);
      res.status(200).json({ message: 'Si ce compte existe, un email de réinitialisation a été envoyé.' });
    } catch (error) {
      logger.error('ForgotPassword Error:', error);
      res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation.' });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      const resetRequest = await UserPasswordReset.findOne({
        where: {
          token,
          usedAt: null,
          expiresAt: { [Op.gt]: new Date() }
        }
      });

      if (!resetRequest) {
        return res.status(400).json({ error: 'Token invalide ou expiré.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await User.update(
        { password: hashedPassword, failedAttempts: 0, lockUntil: null },
        { where: { userId: resetRequest.userId } }
      );

      await resetRequest.update({ usedAt: new Date() });
      res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
    } catch (error) {
      logger.error('ResetPassword Error:', error);
      res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe.' });
    }
  }
}

export default new AuthController();
