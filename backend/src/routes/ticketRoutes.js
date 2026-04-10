import express from 'express';
import ticketController from '../controllers/ticketController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Création de ticket (Borne ou Agent)
router.post('/', ticketController.createTicket);

// Validation de commande Sage X3 (Borne)
router.get('/validate-order/:orderNumber', ticketController.validateOrder);

// Log d'impression (Borne ou Agent)
router.post('/:ticketId/log-print', ticketController.logPrint);

// Liste des tickets avec filtres (Public pour la borne)
router.get('/', ticketController.getTickets);

// Liste des tickets par file d'attente
router.get('/queue/:queueId', ticketController.getTicketsByQueue);

// Actions sur un ticket spécifique
router.patch('/:ticketId/call', authMiddleware.verifyToken, ticketController.handleCall);
router.patch('/:ticketId/recall', authMiddleware.verifyToken, ticketController.handleRecall);
router.patch('/:ticketId/process', authMiddleware.verifyToken, ticketController.handleProcess);
router.patch('/:ticketId/assign', authMiddleware.verifyToken, ticketController.handleAssign);
router.patch('/:ticketId/priority', authMiddleware.verifyToken, ticketController.updatePriority);
router.post('/:ticketId/cancel', authMiddleware.verifyToken, ticketController.cancelTicket);
router.patch('/:ticketId/isolate', authMiddleware.verifyToken, ticketController.isolateTicket);
router.patch('/:ticketId/transfer', authMiddleware.verifyToken, ticketController.transferTicket);

// Configuration dynamique
router.get('/:ticketId/step-config', authMiddleware.verifyToken, ticketController.getStepConfig);
router.get('/:ticketId/full-history', authMiddleware.verifyToken, ticketController.getTicketFullHistory);
router.get('/quai-history/:quaiId', authMiddleware.verifyToken, ticketController.getQuaiHistory);

// Validation d'une étape (Moteur Agnostique)
// Cette route remplace les routes spécifiques (weighing, loading, etc.)
router.post('/:ticketId/complete', authMiddleware.verifyToken, ticketController.completeStep);

export default router;
