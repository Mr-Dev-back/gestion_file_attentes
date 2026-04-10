import jwt from 'jsonwebtoken';
import { User, Role, Permission, Site, Company, Queue } from '../models/index.js';
import logger from '../config/logger.js';

class AuthMiddleware {
    constructor() {
        this.verifyToken = this.authenticate.bind(this);
    }

    // Middleware d'authentification (Vérification JWT)
    async authenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            let token = null;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            } else if (req.cookies && req.cookies.accessToken) {
                token = req.cookies.accessToken;
            }

            if (!token) {
                return res.status(401).json({ error: 'Accès non autorisé. Token manquant.' });
            }
            
            if (!process.env.JWT_SECRET) {
                logger.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
                return res.status(500).json({ error: 'Erreur de configuration serveur.' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (!decoded || !decoded.id) {
                return res.status(401).json({ error: 'Token invalide ou malformé.' });
            }

            const user = await User.findByPk(decoded.id, {
                include: [
                    {
                        model: Role,
                        as: 'assignedRole',
                        include: [{
                            model: Permission,
                            as: 'permissions'
                        }]
                    },
                    {
                        model: Site,
                        as: 'site',
                        include: [{
                            model: Company,
                            as: 'company'
                        }]
                    },
                    {
                        model: Queue,
                        as: 'queue',
                        attributes: ['name']
                    }
                ]
            });

            if (!user) {
                logger.warn(`AUTHENTICATION FAILED: User ID ${decoded.id} not found.`);
                return res.status(401).json({ error: 'Utilisateur non trouvé.' });
            }
            
            if (!user.assignedRole) {
                logger.warn(`User ${user.userId} has no assigned role. roleId in DB: ${user.roleId}. token role: ${decoded.role}`);
                return res.status(403).json({ error: 'Accès refusé. Aucun rôle assigné.', userId: user.userId, roleId: user.roleId });
            }

            if (!user.isActive) {
                return res.status(403).json({ error: 'Compte désactivé.' });
            }

            req.user = user;

            // Map permissions to a simple array of codes
            if (user.assignedRole && user.assignedRole.permissions) {
                req.user.permissionCodes = user.assignedRole.permissions.map(p => p.code);
            } else {
                req.user.permissionCodes = [];
            }

            next();
        } catch (error) {
            logger.error('AUTHENTICATION ERROR:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
            }
            return res.status(401).json({ error: 'Token invalide.' });
        }
    }

    /**
     * Check if user has a specific permission
     * @param {string} requiredPermission e.g. 'ticket:create'
     */
    hasPermission(requiredPermission) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'Utilisateur non authentifié.' });
            }

            if (req.user.role === 'ADMINISTRATOR') {
                return next();
            }

            if (!req.user.permissionCodes || !req.user.permissionCodes.includes(requiredPermission)) {
                return res.status(403).json({
                    error: 'Accès refusé. Permission requise.',
                    required: requiredPermission
                });
            }

            next();
        };
    }

    // Middleware d'autorisation (RBAC)
    // Middleware d'autorisation (RBAC)
    authorize(allowedRoles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'Utilisateur non authentifié.' });
            }

            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            // Hierarchical Logic: Admin and Supervisor usually have access to everything below them
            // But strict RBAC requested: "Admin doesn't do business actions"

            // Check if user's role is strictly in the allowed list
            if (!roles.includes(req.user.role)) {
                // Exceptional Hierarchical Overrides
                // Example: Supervisor can do what Manager does (Override logic)
                if (allowedRoles.includes('MANAGER') && req.user.role === 'SUPERVISOR') {
                    // Pass through for Supervisor overriding Manager actions if verified elsewhere
                    return next();
                }

                return res.status(403).json({
                    error: 'Accès refusé. Privilèges insuffisants.',
                    required: roles,
                    current: req.user.role
                });
            }

            next();
        };
    }
    /**
     * @returns { boolean }
     */
    checkScope(user, targetSiteId = null, targetCompanyId = null) {
        // 1. ADMINISTRATOR has global access
        if (user.role === 'ADMINISTRATOR') return true;

        // 2. MANAGER: Restricted to their Company (and all sites within)
        if (user.role === 'MANAGER') {
            // If target is a Company
            if (targetCompanyId) {
                return user.site?.companyId === targetCompanyId;
            }

            // If target is a Site
            if (targetSiteId) {
                // Assuming Manager is bound to a single Site for now, or check company match if Site model loaded
                return user.siteId === targetSiteId;
            }
        }

        // 3. SUPERVISOR / AGENT: Strictly their Site
        if (['SUPERVISOR', 'AGENT_QUAI'].includes(user.role)) {
            if (targetSiteId) {
                return user.siteId === targetSiteId;
            }
            // They shouldn't be accessing Company endpoints directly usually
            if (targetCompanyId) return false;
        }

        return false;
    }

    /**
     * WebSocket authentication middleware
     */
    async authenticateSocket(socket, next) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            
            if (!token) {
                // Allow guest connection for Public TV
                socket.user = {
                    role: 'GUEST',
                    isGuest: true,
                    permissionCodes: []
                };
                return next();
            }

            if (!process.env.JWT_SECRET) {
                logger.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
                return next(new Error('Erreur de configuration serveur.'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id, {
                include: [
                    {
                        model: Role,
                        as: 'assignedRole',
                        include: [{
                            model: Permission,
                            as: 'permissions'
                        }]
                    },
                    {
                        model: Site,
                        as: 'site',
                        include: [{
                            model: Company,
                            as: 'company'
                        }]
                    },
                    {
                        model: Queue,
                        as: 'queue',
                        attributes: ['name']
                    }
                ]
            });

            if (!user) return next(new Error('Utilisateur non trouvé.'));
            
            if (!user.assignedRole) {
                logger.warn(`User ${user.userId} has no assigned role (Socket). roleId in DB: ${user.roleId}. token role: ${decoded.role}`);
                return next(new Error('Accès refusé. Aucun rôle assigné.'));
            }

            if (!user.isActive) return next(new Error('Compte désactivé.'));

            socket.user = user;
            socket.user.permissionCodes = user.assignedRole?.permissions.map(p => p.code) || [];
            next();
        } catch (error) {
            logger.error('SOCKET AUTH ERROR:', error);
            // If token is invalid, we don't allow guest fallback for security (might be a malformed attempt)
            next(new Error(`Authentification échouée: ${error.message}`));
        }
    }
}

export default new AuthMiddleware();
