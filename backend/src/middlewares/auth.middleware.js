import jwt from 'jsonwebtoken';
import { Company, Queue, Site, User } from '../models/index.js';
import logger from '../config/logger.js';
import {
  defineAbilitiesFor,
  rbacUserAuthorizationInclude
} from '../config/ability.js';

/**
 * [SENIOR NOTE] Inclusion de base pour charger l'utilisateur avec ses relations RBAC.
 * On utilise rbacUserAuthorizationInclude qui contient les rôles et permissions Spatie.
 */
const baseUserInclude = [
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

class AuthMiddleware {
  /**
   * [SENIOR NOTE] Utilisation de fonctions fléchées pour les méthodes de classe 
   * afin de garantir que 'this' pointe toujours vers l'instance de AuthMiddleware,
   * résolvant ainsi l'erreur "this.loadUser is not a function".
   */

  /**
   * Charge l'utilisateur complet avec ses rôles et permissions.
   */
  loadUser = async (userId) => {
    return User.findByPk(userId, {
      include: baseUserInclude
    });
  };

  /**
   * Hydrate l'objet utilisateur avec les capacités CASL et les codes de permission 
   * pour une utilisation fluide dans le reste de l'application.
   */
  hydrateRuntimeRbac = async (user) => {
    // Récupération de tous les noms de permissions (via rôles et directes)
    // On utilise la nouvelle méthode ajoutée sur le modèle User lors du refactor Spatie
    const permissionNames = await user.getAllPermissionNames();

    // Injection des codes pour compatibilité frontend/middlewares
    user.permissionCodes = permissionNames;
    user.permissions = permissionNames;
    
    // Génération des capacités CASL (Permissions granulaires)
    user.ability = defineAbilitiesFor(user);

    return user;
  };

  /**
   * Middleware d'authentification principal pour les routes Express.
   */
  authenticate = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      let token = null;

      // Priorité 1 : Header Authorization Bearer
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } 
      // Priorité 2 : Cookie HTTP-only (Sécurité renforcée)
      else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
      }

      if (!token) {
        return res.status(401).json({ error: 'Accès non autorisé. Token manquant.' });
      }

      if (!process.env.JWT_SECRET) {
        logger.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
        return res.status(500).json({ error: 'Erreur de configuration serveur.' });
      }

      // Vérification et décodage du JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded?.id) {
        return res.status(401).json({ error: 'Token invalide ou malformé.' });
      }

      // Chargement de l'utilisateur avec la nouvelle structure RBAC
      const user = await this.loadUser(decoded.id);
      if (!user) {
        logger.warn(`AUTHENTICATION FAILED: User ID ${decoded.id} not found.`);
        return res.status(401).json({ error: 'Utilisateur non trouvé.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Compte désactivé.' });
      }

      // Hydratation RBAC (Permissions Spatie -> CASL Ability)
      req.user = await this.hydrateRuntimeRbac(user);
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
      }
      logger.error('AUTHENTICATION ERROR:', error);
      return res.status(401).json({ error: 'Token invalide.' });
    }
  };

  /**
   * Middleware de vérification de capacité via CASL.
   * Utilise les permissions dynamiques héritées des rôles Spatie.
   */
  checkAbility = (action, subject) => {
    return (req, res, next) => {
      if (!req.user?.ability) {
        return res.status(401).json({ error: 'Utilisateur non authentifié ou capacités non définies.' });
      }

      if (req.user.ability.can(action, subject)) {
        return next();
      }

      return res.status(403).json({
        error: `Accès refusé. Vous n'avez pas la capacité de : ${action} sur ${subject}`,
        required: { action, subject }
      });
    };
  };

  /**
   * Middleware de vérification de rôle (Nouvelle version Spatie-compatible).
   */
  hasRole = (requiredRoles) => {
    return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Utilisateur non authentifié.' });
      }

      const allowed = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      // Utilisation de la méthode d'instance User.hasRole (inclut rôles directs et via model_has_roles)
      const hasRequiredRole = await req.user.hasRole(allowed);

      if (hasRequiredRole) {
        return next();
      }

      return res.status(403).json({
        error: 'Accès refusé. Rôle requis.',
        required: allowed
      });
    };
  };

  /**
   * Alias pour hasRole (compatibilité avec le code existant)
   */
  authorize = (requiredRoles) => {
    return this.hasRole(requiredRoles);
  };

  /**
   * Alias pour authenticate (compatibilité avec le code existant utilisant verifyToken)
   */
  verifyToken = (req, res, next) => {
    return this.authenticate(req, res, next);
  };

  /**
   * Middleware de vérification de permission granulaire (Spatie-compatible).
   */
  hasPermission = (requiredPermission) => {
    return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Utilisateur non authentifié.' });
      }

      // Utilisation de la méthode d'instance User.hasPermission
      const hasRequiredPerm = await req.user.hasPermission(requiredPermission);

      if (hasRequiredPerm) {
        return next();
      }

      return res.status(403).json({
        error: 'Accès refusé. Permission requise.',
        required: requiredPermission
      });
    };
  };

  /**
   * Middleware Socket.io pour l'authentification en temps réel.
   */
  authenticateSocket = async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      // Invité (Lecture seule limitée par exemple)
      if (!token) {
        socket.user = {
          role: 'GUEST',
          isGuest: true,
          permissionCodes: [],
          permissions: []
        };
        return next();
      }

      if (!process.env.JWT_SECRET) {
        logger.error('FATAL ERROR: JWT_SECRET not defined (Socket).');
        return next(new Error('Erreur de configuration serveur.'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await this.loadUser(decoded.id);

      if (!user) {
        return next(new Error('Utilisateur non trouvé.'));
      }

      if (!user.isActive) {
        return next(new Error('Compte désactivé.'));
      }

      // Hydratation RBAC pour Socket
      socket.user = await this.hydrateRuntimeRbac(user);
      next();
    } catch (error) {
      logger.error('SOCKET AUTH ERROR:', error);
      next(new Error(`Authentification échouée: ${error.message}`));
    }
  };

  /**
   * Vérification de scope (Site/Compagnie).
   * Utile pour s'assurer qu'un Manager ne modifie que son site.
   */
  checkScope = (user, targetSiteId = null, targetCompanyId = null) => {
    // L'administrateur a un scope global
    if (user.assignedRole?.name === 'ADMINISTRATOR') return true;

    // Logique Manager
    if (user.assignedRole?.name === 'MANAGER') {
      if (targetCompanyId) {
        return user.site?.companyId === targetCompanyId || user.companyId === targetCompanyId;
      }
      if (targetSiteId) return user.siteId === targetSiteId;
    }

    // Autres rôles limités à leur site
    if (targetSiteId) return user.siteId === targetSiteId;

    return false;
  };
}

const authMiddleware = new AuthMiddleware();

/**
 * [SENIOR NOTE] Exports nommés pour garder la compatibilité avec les imports existants.
 * Les liaisons sont automatiques grâce aux fonctions fléchées dans la classe.
 */
export const authenticate = authMiddleware.authenticate;
export const checkAbility = authMiddleware.checkAbility;
export const hasRole = authMiddleware.hasRole;
export const authorize = authMiddleware.hasRole; // Alias pour compatibilité ascendante
export const verifyToken = authMiddleware.authenticate; // Alias pour compatibilité ascendante
export const hasPermission = authMiddleware.hasPermission;
export const authenticateSocket = authMiddleware.authenticateSocket;

export default authMiddleware;
