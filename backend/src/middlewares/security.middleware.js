import logger from '../config/logger.js';

/**
 * ═══════════════════════════════════════════════════════════
 * GesParc — Security Middleware
 * Couche de sécurité applicative globale
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Désactive l'en-tête X-Powered-By (complément à Helmet)
 */
export const disablePoweredBy = (req, res, next) => {
    res.removeHeader('X-Powered-By');
    next();
};

/**
 * Inject les headers de sécurité complémentaires à Helmet
 */
export const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
};

/**
 * Bloque les requêtes avec des payloads trop volumineux
 * (Couche applicative, en complément de client_max_body_size Nginx)
 */
export const payloadSizeGuard = (maxSizeKB = 512) => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0', 10);
        const maxBytes = maxSizeKB * 1024;

        if (contentLength > maxBytes) {
            logger.warn(`Payload trop volumineux bloqué: ${contentLength} bytes depuis ${req.ip}`);
            return res.status(413).json({
                error: `Payload trop volumineux. Maximum autorisé: ${maxSizeKB} KB.`
            });
        }
        next();
    };
};

/**
 * Vérifie que les variables d'environnement critiques sont définies au démarrage.
 * Appelée une seule fois lors du boot du serveur.
 */
export const validateEnvironment = () => {
    const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_PASSWORD'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        logger.error(`FATAL: Variables d'environnement manquantes: ${missing.join(', ')}`);
        logger.error('Le serveur NE DOIT PAS démarrer sans ces variables en production.');

        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }

    // Vérification de la force des secrets JWT
    if (process.env.NODE_ENV === 'production') {
        const jwtSecret = process.env.JWT_SECRET || '';
        if (jwtSecret.length < 32) {
            logger.error('FATAL: JWT_SECRET trop court (minimum 32 caractères en production).');
            process.exit(1);
        }
    }

    logger.info('✔ Validation des variables d\'environnement réussie.');
};

/**
 * Log les tentatives d'accès suspectes (user-agents vides, bots connus)
 */
export const suspiciousRequestLogger = (req, res, next) => {
    const ua = req.headers['user-agent'] || '';

    if (!ua || ua.length < 10) {
        logger.warn(`[SECURITY] Requête sans User-Agent valide: ${req.method} ${req.path} depuis ${req.ip}`);
    }

    next();
};
