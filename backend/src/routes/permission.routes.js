import { Router } from 'express';
import permissionController from '../controllers/permissionController.js';
import resourceController from '../controllers/ResourceController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

// All permission routes are reserved for ADMINISTRATOR
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize(['ADMINISTRATOR']));

// Permission Routes
router.get('/', permissionController.getAll);
router.get('/actions', permissionController.getActions);
router.post('/', permissionController.create);
router.put('/:id', permissionController.update);
router.delete('/:id', permissionController.delete);

// Resource Management Routes (Expanded CRUD)
router.get('/resources', resourceController.getAll);
router.post('/resources', resourceController.create);
router.put('/resources/:id', resourceController.update);
router.delete('/resources/bulk', resourceController.bulkDelete);
router.delete('/resources/:id', resourceController.delete);

router.delete('/actions/:id', permissionController.deleteAction);

export default router;
