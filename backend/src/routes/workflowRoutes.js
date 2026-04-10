import express from 'express';
import {
    getAllWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    bulkUpdateWorkflowStatus,
    addStep,
    updateStep,
    deleteStep
} from '../controllers/workflowController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware.verifyToken);

// Workflows
router.get('/', getAllWorkflows);
router.post('/', authMiddleware.authorize(['ADMINISTRATOR']), createWorkflow);
router.patch('/bulk-status', authMiddleware.authorize(['ADMINISTRATOR']), bulkUpdateWorkflowStatus);
router.put('/:id', authMiddleware.authorize(['ADMINISTRATOR']), updateWorkflow);
router.delete('/:id', authMiddleware.authorize(['ADMINISTRATOR']), deleteWorkflow);

// Steps
router.post('/:workflowId/steps', authMiddleware.authorize(['ADMINISTRATOR']), addStep);
router.put('/steps/:id', authMiddleware.authorize(['ADMINISTRATOR']), updateStep); // ID is Step ID
router.delete('/steps/:id', authMiddleware.authorize(['ADMINISTRATOR']), deleteStep);

export default router;
