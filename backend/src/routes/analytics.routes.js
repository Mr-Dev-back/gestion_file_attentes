import express from 'express';
import AnalyticsController from '../controllers/AnalyticsController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize(['ADMINISTRATOR', 'MANAGER', 'SUPERVISOR']));

/**
 * @swagger
 * /api/analytics/stats:
 *   get:
 *     summary: KPIs opérationnels avec filtre de site
 *     tags: [Analytics]
 */
router.get('/stats', AnalyticsController.getStats);
router.get('/summary', AnalyticsController.getStats);
router.get('/performance', AnalyticsController.getStats);
router.get('/site-details', AnalyticsController.getSiteDetails);

export default router;
