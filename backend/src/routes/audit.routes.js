import express from 'express';
import auditController from '../controllers/auditController.js';
import { authenticate, checkAbility } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route GET /api/audit/logs
 * @desc Récupérer les logs d'audit (Boîte Noire)
 * @access Admin (Protection CASL)
 */
router.get('/logs', authenticate, checkAbility('read', 'AuditLog'), auditController.getLogs);

/**
 * @route GET /api/audit/actions
 * @desc Récupérer la liste des types d'actions pour filtrage
 * @access Admin
 */
router.get('/actions', authenticate, checkAbility('read', 'AuditLog'), auditController.getActionTypes);

export default router;
