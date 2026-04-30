import rateLimit from 'express-rate-limit';

/**
 * ═══════════════════════════════════════════════════════════
 * GesParc — Rate Limiters
 * Protection contre les attaques par force brute et le flood
 * ═══════════════════════════════════════════════════════════
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Rate limiter GLOBAL pour toutes les routes /api/*
 * Production : 2000 requêtes / 15 min par IP (augmenté de 100)
 * Développement : 10000 requêtes / 15 min (relaxé)
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 10000 : 2000,
    message: {
        error: 'Trop de requêtes depuis cette adresse IP. Veuillez réessayer dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        // Utilise X-Forwarded-For si derrière Nginx, sinon IP directe
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    }
});

/**
 * Rate limiter STRICT pour /api/auth/login
 * Production : 20 tentatives / 5 min par IP (augmenté de 5)
 */
export const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: isDev ? 500 : 20,
    message: {
        error: 'Trop de tentatives de connexion. Veuillez réessayer dans 5 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    }
});

/**
 * Rate limiter pour /api/auth/* (général auth: refresh, logout, forgot-password)
 * Production : 100 tentatives / 5 min (augmenté de 10)
 */
export const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: isDev ? 1000 : 100,
    message: {
        error: 'Trop de requêtes d\'authentification. Veuillez réessayer dans 5 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    }
});

/**
 * Rate limiter pour /api/auth/refresh-token
 * Production : 100 tentatives / 5 min (augmenté de 10)
 */
export const refreshTokenLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: isDev ? 1000 : 100,
    message: {
        error: 'Trop de tentatives de rafraîchissement de token. Veuillez vous reconnecter.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    }
});

/**
 * Rate limiter pour la création d'utilisateurs (/api/users POST)
 * Production : 10 requêtes / heure par IP
 */
export const userCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: isDev ? 100 : 10,
    message: {
        error: 'Trop de créations d\'utilisateurs. Veuillez réessayer ultérieurement.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Appliquer uniquement aux POST
    skip: (req) => req.method !== 'POST',
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    }
});

/**
 * Rate limiter modéré pour les endpoints de création générale
 * Production : 20 créations / 15 min par IP
 */
export const createLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 200 : 20,
    message: {
        error: 'Trop de créations. Veuillez patienter avant de créer de nouveaux éléments.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    }
});
