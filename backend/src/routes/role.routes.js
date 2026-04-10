import express from 'express';
import roleController from '../controllers/roleController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// All role routes are reserved for ADMINISTRATOR
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize(['ADMINISTRATOR']));

router.get('/', roleController.getAll);
router.post('/', roleController.create);
router.put('/:id', roleController.update);
router.delete('/:id', roleController.delete);
router.patch('/:id/permissions', roleController.updatePermissions);

export default router;
