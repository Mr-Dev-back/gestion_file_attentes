import express from 'express';
import siteController from '../controllers/siteController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware.authenticate);

router.delete('/bulk', authMiddleware.authorize('ADMINISTRATOR'), siteController.bulkDelete);
router.get('/', siteController.getAll);
router.get('/:id', siteController.getOne);
router.post('/', authMiddleware.authorize('ADMINISTRATOR'), siteController.create);
router.put('/:id', authMiddleware.authorize('ADMINISTRATOR'), siteController.update);
router.delete('/:id', authMiddleware.authorize('ADMINISTRATOR'), siteController.delete);

export default router;
