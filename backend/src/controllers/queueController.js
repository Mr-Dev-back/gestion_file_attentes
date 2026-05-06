import { Queue, Ticket, WorkflowStep, Category, QuaiParameter, AuditLog, sequelize, Site } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class QueueController {
    async getAllQueues(req, res) {
        try {
            const queues = await Queue.findAll({
                include: [
                    {
                        model: WorkflowStep,
                        as: 'step',
                        attributes: ['stepId', 'code', 'name']
                    },
                    {
                        model: QuaiParameter,
                        as: 'quai',
                        attributes: ['quaiId', 'label']
                    },
                    {
                        model: Category,
                        as: 'category',
                        attributes: ['categoryId', 'name', 'prefix', 'color']
                    },
                    {
                        model: Site,
                        as: 'site',
                        attributes: ['siteId', 'name', 'code']
                    }
                ]
            });
            const normalizedQueues = queues.map((queue) => {
                const plain = queue.toJSON();
                return {
                    ...plain,
                    isActive: plain.isActived ?? true
                };
            });

            res.json(normalizedQueues);
        } catch (error) {
            logger.error('Error fetching queues:', error);
            res.status(500).json({ error: 'Erreur récupération files d\'attente.' });
        }
    }

    async getQueueStatus(req, res) {
        try {
            const queues = await Queue.findAll({
                attributes: ['queueId', 'name', 'stepId'],
                include: [
                    {
                        model: WorkflowStep,
                        as: 'step',
                        attributes: ['stepId']
                    }
                ]
            });

            const stats = await Promise.all(queues.map(async (q) => {
                const stepIds = q.stepId ? [q.stepId] : [];

                if (stepIds.length === 0) {
                    return {
                        queueId: q.queueId,
                        name: q.name,
                        waiting: 0,
                        processing: 0,
                        completed: 0
                    };
                }

                const waiting = await Ticket.count({ where: { currentStepId: stepIds, status: 'EN_ATTENTE' } });
                const processing = await Ticket.count({ where: { currentStepId: stepIds, status: 'PROCESSING' } });
                const completed = await Ticket.count({ where: { currentStepId: stepIds, status: 'COMPLETE' } });

                return {
                    queueId: q.queueId,
                    name: q.name,
                    waiting,
                    processing,
                    completed
                };
            }));

            res.json(stats);
        } catch (error) {
            logger.error('Error fetching queue status:', error);
            res.status(500).json({ error: 'Erreur statut files.' });
        }
    }

    async createQueue(req, res) {
        try {
            const { name, isActive, description, categoryId, stepId, quaiId, siteId } = req.body;

            const queue = await Queue.create({
                name,
                description: description || null,
                isActived: isActive ?? true,
                categoryId: categoryId || null,
                stepId: stepId || null,
                quaiId: quaiId || null,
                siteId: siteId || null
            });

            const plain = queue.toJSON();
            res.status(201).json({
                ...plain,
                isActive: plain.isActived ?? true
            });
        } catch (error) {
            logger.error('Error creating queue:', error);
            res.status(500).json({ error: 'Erreur création file d\'attente.' });
        }
    }

    async updateQueue(req, res) {
        try {
            const { id } = req.params;
            const { name, isActive, description, categoryId, stepId, quaiId, siteId } = req.body;

            const queue = await Queue.findByPk(id);
            if (!queue) return res.status(404).json({ error: 'File d\'attente non trouvée' });

            await queue.update({
                name,
                description,
                isActived: isActive,
                categoryId: categoryId || null,
                stepId: stepId || null,
                quaiId: quaiId || null,
                siteId: siteId || null
            });

            const plain = queue.toJSON();
            res.json({
                ...plain,
                isActive: plain.isActived ?? true
            });
        } catch (error) {
            logger.error('Error updating queue:', error);
            res.status(500).json({ error: 'Erreur mise à jour file d\'attente.' });
        }
    }

    async deleteQueue(req, res) {
        return res.status(405).json({ 
            error: 'La suppression physique n\'est pas autorisée. Veuillez désactiver la file d\'attente à la place.' 
        });
    }

    async bulkUpdateStatus(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { ids, isActive } = req.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'Une liste d\'IDs est requise.' });
            }

            await Queue.update(
                { isActived: isActive },
                { where: { queueId: { [Op.in]: ids } }, transaction }
            );

            await AuditLog.create({
                userId: req.user.userId,
                action: 'BULK_UPDATE_QUEUE_STATUS',
                details: { count: ids.length, ids, isActive },
                ipAddress: req.ip
            }, { transaction });

            await transaction.commit();
            res.json({ message: `${ids.length} files d'attente mises à jour.` });
        } catch (error) {
            if (transaction) await transaction.rollback();
            logger.error('Error bulk update queue status:', error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour groupée.' });
        }
    }
}

export default new QueueController();
