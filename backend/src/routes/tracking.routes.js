import express from 'express';
import trackingController from '../controllers/trackingController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Recherche d'un véhicule par matricule - Accessible uniquement par le SUPERVISOR
router.get(
    '/search/:plateNumber',
    authMiddleware.verifyToken,
    authMiddleware.authorize(['SUPERVISOR', 'ADMINISTRATOR', 'EXPLOITATION']),
    trackingController.searchVehicle
);

router.get('/debug/latest', trackingController.debugLatest);

export default router;
