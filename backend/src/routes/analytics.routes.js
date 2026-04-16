import express from 'express';
import AnalyticsController from '../controllers/AnalyticsController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Toutes les routes analytiques nécessitent d'avoir la capacité de lire les Analytics
router.use(authMiddleware.authenticate);
router.use(authMiddleware.checkAbility('read', 'Analytics'));

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     summary: Résumé des statistiques (Aujourd'hui, En attente, Temps moyen)
 *     tags: [Analytics]
 */
router.get('/summary', AnalyticsController.getSummary);

/**
 * @swagger
 * /api/analytics/performance:
 *   get:
 *     summary: Indicateurs de performance (Efficacité, SLA, Complétion)
 *     tags: [Analytics]
 */
router.get('/performance', AnalyticsController.getPerformance);

export default router;
