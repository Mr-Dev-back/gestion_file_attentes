import express from 'express';
import auditController from '../controllers/auditController.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route GET /api/audit/logs
 * @desc Récupérer les logs d'audit (Boîte Noire)
 * @access Admin & Manager
 */
router.get('/logs', authenticate, authorize(['ADMINISTRATOR', 'MANAGER']), auditController.getLogs);

/**
 * @route GET /api/audit/actions
 * @desc Récupérer la liste des types d'actions pour filtrage
 * @access Admin & Manager
 */
router.get('/actions', authenticate, authorize(['ADMINISTRATOR', 'MANAGER']), auditController.getActionTypes);

export default router;
