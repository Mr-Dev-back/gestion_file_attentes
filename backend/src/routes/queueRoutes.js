import express from 'express';
import queueController from '../controllers/queueController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/queues - List all queues
router.get('/', authMiddleware.verifyToken, queueController.getAllQueues);

// GET /api/queues/status - Get status/stats
router.get('/status', authMiddleware.verifyToken, queueController.getQueueStatus);

// POST /api/queues - Create queue
router.post('/', authMiddleware.verifyToken, authMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), queueController.createQueue);

// PUT /api/queues/:id - Update queue
router.put('/:id', authMiddleware.verifyToken, authMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), queueController.updateQueue);

// PATCH /api/queues/bulk-status - Bulk update status
router.patch('/bulk-status', authMiddleware.verifyToken, authMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), queueController.bulkUpdateStatus);

// DELETE /api/queues/:id - Delete queue
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.authorize(['ADMINISTRATOR', 'MANAGER']), queueController.deleteQueue);

export default router;
