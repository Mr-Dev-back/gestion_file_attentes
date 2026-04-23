import { Workflow, WorkflowStep, Queue, WorkflowStepQueue, AuditLog, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

// --- Workflow CRUD ---

export const getAllWorkflows = async (req, res) => {
    try {
        const workflows = await Workflow.findAll({
            include: [
                { 
                    model: WorkflowStep, 
                    as: 'steps',
                    include: [
                        { model: Queue, as: 'queues' }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        const normalized = workflows.map(wf => {
            const plain = wf.toJSON();
            return {
                ...plain,
                isActive: plain.isActived ?? true,
                steps: plain.steps?.map(s => ({
                    ...s,
                    isActive: s.isActived ?? true
                }))
            };
        });
        
        res.json(normalized);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createWorkflow = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        const workflow = await Workflow.create({ 
            name, 
            description,
            isActived: isActive ?? true
        });
        res.status(201).json(workflow);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateWorkflow = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        
        const workflow = await Workflow.findByPk(id);
        if (!workflow) return res.status(404).json({ error: 'Flux introuvable' });

        await workflow.update({
            name,
            description,
            isActived: isActive ?? workflow.isActived
        });
        
        res.json({
            ...workflow.toJSON(),
            isActive: workflow.isActived
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteWorkflow = async (req, res) => {
    return res.status(405).json({ 
        error: 'La suppression physique n\'est pas autorisée. Veuillez désactiver le workflow à la place.' 
    });
};

/**
 * Mise à jour groupée du statut des workflows
 */
export const bulkUpdateWorkflowStatus = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { ids, isActive } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Une liste d\'IDs est requise.' });
        }

        await Workflow.update(
            { isActived: isActive },
            { where: { workflowId: { [Op.in]: ids } }, transaction }
        );

        await AuditLog.create({
            userId: req.user.userId,
            action: 'BULK_UPDATE_WORKFLOW_STATUS',
            details: { count: ids.length, ids, isActive },
            ipAddress: req.ip
        }, { transaction });

        await transaction.commit();
        res.json({ message: `${ids.length} workflows mis à jour.` });
    } catch (error) {
        if (transaction) await transaction.rollback();
        logger.error('Erreur bulk update workflow status:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour groupée.' });
    }
};

// --- Steps CRUD ---

export const addStep = async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { queueIds, ...stepData } = req.body;
        
        const step = await WorkflowStep.create({ ...stepData, workflowId, isActived: true });
        
        if (queueIds && Array.isArray(queueIds)) {
            const associations = queueIds.map(qId => ({
                stepId: step.stepId,
                queueId: qId
            }));
            await WorkflowStepQueue.bulkCreate(associations);
        }
        
        res.status(201).json(step);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateStep = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive, queueIds, ...otherData } = req.body;
        
        const step = await WorkflowStep.findByPk(id);
        if (!step) return res.status(404).json({ error: 'Étape introuvable' });
        
        const updateData = { ...otherData };
        if (isActive !== undefined) updateData.isActived = isActive;
        
        await step.update(updateData);
        
        if (queueIds && Array.isArray(queueIds)) {
            // Sync associations
            await WorkflowStepQueue.destroy({ where: { stepId: id } });
            const associations = queueIds.map(qId => ({
                stepId: id,
                queueId: qId
            }));
            await WorkflowStepQueue.bulkCreate(associations);
        }
        
        res.json({
            ...step.toJSON(),
            isActive: step.isActived
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteStep = async (req, res) => {
    return res.status(405).json({ 
        error: 'La suppression physique n\'est pas autorisée. Veuillez désactiver l\'étape à la place.' 
    });
};

export const getWorkflowSteps = async (req, res) => {
    try {
        const { workflowId } = req.params;
        const steps = await WorkflowStep.findAll({
            where: { workflowId },
            include: [{ model: Queue, as: 'queues' }],
            order: [['orderNumber', 'ASC']]
        });
        res.json(steps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
