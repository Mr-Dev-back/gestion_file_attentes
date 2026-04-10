import rateLimit from 'express-rate-limit';

/**
 * Rate limiter général pour toutes les routes API
 * Limite: 100 requêtes par 15 minutes par IP
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 5000 : 100, // Augmented for dev
    message: {
        error: 'Trop de requêtes depuis cette adresse IP. Veuillez réessayer dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 100 : 5, // Augmented for dev
    message: {
        error: 'Trop de tentatives de connexion... Veuillez réessayer dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});

/**
 * Rate limiter modéré pour les endpoints de création
 * Limite: 20 créations par 15 minutes par IP
 */
export const createLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        error: 'Trop de créations. Veuillez patienter avant de créer de nouveaux éléments.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
