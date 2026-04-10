import express from 'express';
import quaiController from '../controllers/quaiController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Récupération de la liste des quais actifs/configurés
router.get('/active', authMiddleware.verifyToken, quaiController.getActiveQuais);

// Récupération de la configuration d'un quai par son ID
router.get('/config/:quaiId', authMiddleware.verifyToken, quaiController.getQuaiConfigById);

// Récupération de la configuration dynamique d'un quai pour une étape donnée
router.get('/:quaiId/config/:stepId', authMiddleware.verifyToken, quaiController.getQuaiConfig);
router.get('/available-for-step/:stepId', authMiddleware.verifyToken, quaiController.getQuaisByStep);


// Admin: Gestion des paramètres de quais
router.get('/parameters', authMiddleware.verifyToken, authMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), quaiController.getAllQuaiParameters);
router.post('/parameters', authMiddleware.verifyToken, authMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), quaiController.saveQuaiParameter);
router.delete('/parameters/bulk', authMiddleware.verifyToken, authMiddleware.authorize(['ADMINISTRATOR']), quaiController.bulkDeleteQuaiParameters);
router.delete('/parameters/:id', authMiddleware.verifyToken, authMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), quaiController.deleteQuaiParameter);

export default router;
