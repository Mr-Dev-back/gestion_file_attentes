import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User, RefreshToken, Role, Permission, AuditLog, UserPasswordReset, Site, Company, Queue } from '../models/index.js';
import logger from '../config/logger.js';
import bcrypt from 'bcrypt';

class AuthController {

    async register(req, res) {
        try {
            const { username, email, password, role, firstName, lastName } = req.body;

            const existingUser = await User.findOne({
                where: {
                    [Op.or]: [
                        { email },
                        { username }
                    ]
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
                roleId: roleObj.roleId,
                isActive: true
            });

            const userWithoutPassword = user.toJSON();
            delete userWithoutPassword.password;

            res.status(201).json({
                message: 'Utilisateur créé avec succès.',
                user: userWithoutPassword
            });

        } catch (error) {
            logger.error('Erreur inscription:', error);
            res.status(500).json({ error: 'Erreur lors de la création du compte.' });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;
            const normalizedEmail = (email || '').trim().toLowerCase();
            const jwtSecret = process.env.JWT_SECRET;

            if (!jwtSecret) {
                logger.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
                return res.status(500).json({ error: 'Erreur de configuration serveur.' });
            }

            const user = await User.findOne({
                where: { email: normalizedEmail },
                include: [
                    {
                        model: Role,
                        as: 'assignedRole',
                        include: [{ model: Permission, as: 'permissions' }]
                    },
                    {
                        model: Site,
                        as: 'site',
                        include: [{ model: Company, as: 'company' }]
                    },
                    {
                        model: Queue,
                        as: 'queue',
                        attributes: ['name', 'quaiId']
                    }
                ]
            });

            if (!user) {
                return res.status(401).json({ error: 'Identifiants invalides' });
            }

            // Vérification du verrouillage du compte
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
                // Backward compatibility: legacy accounts may still store plaintext passwords.
                isValid = password === user.password;
                if (isValid) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password, salt);
                    await user.update({ password: hashedPassword });
                }
            }
            
            if (!isValid) {
                const attempts = (user.failedAttempts || 0) + 1;
                let lockUntil = null;
                if (attempts >= 5) lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock

                await user.update({ failedAttempts: attempts, lockUntil });
                
                await AuditLog.create({ 
                    userId: user.userId, 
                    action: 'LOGIN_FAILED', 
                    details: { attempts, ipAddress },
                    ipAddress 
                });

                if (attempts >= 5) return res.status(403).json({
                    error: 'Compte bloqué suite à trop de tentatives. Réessayez dans 15min.',
                    code: 'ACCOUNT_LOCKED',
                    lockUntil
                });

                return res.status(401).json({
                    error: `Mot de passe incorrect. (${attempts}/5)`,
                    attemptsRemaining: 5 - attempts
                });
            }

            if (!user.isActive) return res.status(403).json({
                error: 'Votre compte est suspendu ou désactivé.',
                code: 'ACCOUNT_DISABLED'
            });

            if (!user.assignedRole) {
                logger.warn(`Login attempt for user ${user.userId} failed: No role assigned.`);
                return res.status(403).json({
                    error: "Votre compte n'a aucun rôle assigné. Contactez un administrateur.",
                    code: 'NO_ROLE_ASSIGNED'
                });
            }

            // Reset des tentatives en cas de succès
            await user.update({ failedAttempts: 0, lockUntil: null });
            
            await AuditLog.create({ 
                userId: user.userId, 
                action: 'LOGIN_SUCCESS', 
                details: { ipAddress },
                ipAddress 
            });

            // --- Génération JWT ---
            const accessToken = jwt.sign(
                { 
                    id: user.userId, 
                    role: user.assignedRole?.name,
                    siteId: user.siteId,
                    assignedQueueId: user.assignedQueueId
                },
                jwtSecret,
                { expiresIn: '1h' }
            );

            // Génération Refresh Token
            const refreshTokenStr = crypto.randomBytes(40).toString('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

            await RefreshToken.create({
                userId: user.userId,
                token: refreshTokenStr,
                expiresAt,
                isRevoked: false
            });

            // Set Cookies
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000 // 1h
            });

            res.cookie('refreshToken', refreshTokenStr, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
            });

            // Fetch site details for complete response
            const userSite = user.siteId ? await Site.findByPk(user.siteId) : null;
            const permissionCodes = user.assignedRole?.permissions?.map(p => p.code) || [];

            res.status(200).json({
                message: 'Connexion réussie.',
                token: accessToken,
                user: {
                    userId: user.userId,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.assignedRole?.name,
                    siteId: user.siteId,
                    assignedQueueId: user.assignedQueueId,
                    quaiId: user.queue?.quaiId, // Envoi direct du quaiId
                    queue: user.queue,
                    site: userSite,
                    assignedRole: user.assignedRole,
                    permissions: permissionCodes
                }
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
            if (!tokenStr) return res.status(401).json({ error: 'Token manquant' });

            const storedToken = await RefreshToken.findOne({
                where: { token: tokenStr, isRevoked: false, expiresAt: { [Op.gt]: new Date() } },
                include: [{ model: User, as: 'user', include: [{ model: Role, as: 'assignedRole' }] }]
            });

            if (!storedToken) {
                return res.status(403).json({ error: 'Refresh token invalide ou expiré' });
            }

            const user = storedToken.user;

            // Nouveau access token
            const newAccessToken = jwt.sign(
                { 
                    id: user.userId, 
                    role: user.assignedRole?.name,
                    siteId: user.siteId,
                    assignedQueueId: user.assignedQueueId
                },
                jwtSecret,
                { expiresIn: '1h' }
            );

            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
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
                include: [
                    {
                        model: Role,
                        as: 'assignedRole',
                        include: [{ model: Permission, as: 'permissions' }]
                    },
                    {
                        model: Site,
                        as: 'site',
                        include: [{ model: Company, as: 'company' }]
                    },
                    {
                        model: Queue,
                        as: 'queue',
                        attributes: ['name', 'quaiId']
                    }
                ]
            });

            if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

            const userResponse = user.toJSON();
            userResponse.permissions = user.assignedRole?.permissions?.map(p => p.code) || [];
            userResponse.siteId = user.siteId;

            res.status(200).json(userResponse);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ where: { email } });

            if (!user) {
                // Pour des raisons de sécurité, on ne dit pas si l'email existe ou non
                return res.status(200).json({ message: 'Si ce compte existe, un email de réinitialisation a été envoyé.' });
            }

            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 3600000); // 1 heure

            await UserPasswordReset.create({
                userId: user.userId,
                token,
                expiresAt
            });

            // Ici, on devrait envoyer l'email. Pour l'instant, on log le token.
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
