import { QuaiParameter, Queue, AuditLog, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class QuaiController {
    /**
     * Récupère la liste des quais actifs/configurés pour l'utilisateur
     * Route: GET /quais/active
     */
    async getActiveQuais(req, res) {
        try {
            const userId = req.user.userId;
            const role = req.user.role;
            const siteId = req.user.siteId;

            // Récupérer tous les paramètres de quais
            const queryOptions = {
                attributes: ['quaiId', 'label', 'allowedUsers', 'siteId']
            };

            const allQuais = await QuaiParameter.findAll(queryOptions);

            // Filtrer par site si l'utilisateur est restreint à un site
            let filteredQuais = allQuais;
            if (siteId && role !== 'ADMINISTRATOR') {
                filteredQuais = filteredQuais.filter(q => q.siteId === siteId || !q.siteId);
            }

            // Filtrer par utilisateur autorisé
            // ADMINISTRATOR, SUPERVISOR, MANAGER, EXPLOITATION voient tout (au moins de leur site)
            // AGENT_QUAI ne voit que ce qui lui est explicitement assigné
            const finalQuais = filteredQuais.filter(quai => {
                if (['ADMINISTRATOR', 'SUPERVISOR', 'MANAGER', 'EXPLOITATION'].includes(role)) {
                    return true;
                }
                
                const allowedUsers = quai.allowedUsers || [];
                // Si AGENT_QUAI, il FAUT qu'il soit dans la liste
                return allowedUsers.includes(userId);
            });

            // Retourner uniquement les champs nécessaires pour le frontend
            const result = finalQuais.map(q => ({
                quaiId: q.quaiId,
                label: q.label,
                siteId: q.siteId
            }));

            res.json(result);
        } catch (error) {
            logger.error('Erreur getActiveQuais:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des quais actifs.' });
        }
    }

    /**
     * Récupère la configuration d'un quai par son ID
     * Route: GET /quais/config/:quaiId
     */
    async getQuaiConfigById(req, res) {
        try {
            const { quaiId } = req.params;
            const userId = req.user.userId;

            const config = await QuaiParameter.findByPk(quaiId);

            if (!config) {
                return res.status(404).json({ error: 'Configuration de quai non trouvée.' });
            }

            // Vérifier si l'utilisateur est autorisé
            const allowedUsers = config.allowedUsers || [];
            if (allowedUsers.length > 0 && !allowedUsers.includes(userId)) {
                return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à accéder à ce quai.' });
            }

            res.json({
                label: config.label,
                expectedStepCode: config.expectedStepCode || null,
                formConfig: config.formConfig
            });
        } catch (error) {
            logger.error('Erreur getQuaiConfigById:', error);
            res.status(500).json({ error: 'Erreur serveur.' });
        }
    }

    /**
     * Récupère la configuration dynamique d'un quai pour une étape donnée
     * Route: GET /quais/:quaiId/config/:stepId
     */
    async getQuaiConfig(req, res) {
        try {
            const { quaiId, stepId } = req.params;
            const userId = req.user.userId; 

            const config = await QuaiParameter.findOne({
                where: { 
                    quaiId: quaiId,
                    stepId: stepId
                }
            });

            if (!config) {
                return res.status(404).json({ error: 'Configuration de quai non trouvée pour cette étape.' });
            }

            // Vérifier si l'utilisateur est autorisé
            const allowedUsers = config.allowedUsers || [];
            if (allowedUsers.length > 0 && !allowedUsers.includes(userId)) {
                return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à accéder à ce quai.' });
            }

            res.json({
                label: config.label,
                expectedStepCode: config.expectedStepCode || null,
                categoryId: config.categoryId || null,
                formConfig: config.formConfig
            });
        } catch (error) {
            logger.error('Erreur getQuaiConfig:', error);
            res.status(500).json({ error: 'Erreur serveur lors de la récupération de la configuration.' });
        }
    }

    /**
     * Liste tous les paramètres de quais (pour l'admin)
     */
    async getAllQuaiParameters(req, res) {
        try {
            const params = await QuaiParameter.findAll({
                include: [{ model: Queue, as: 'queues', attributes: ['queueId', 'name'] }]
            });
            res.json(params);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Crée ou met à jour un paramètre de quai
     */
    async saveQuaiParameter(req, res) {
        try {
            const { quaiId, queueIds, ...data } = req.body;
            let param;
            
            if (quaiId) {
                param = await QuaiParameter.findByPk(quaiId);
                if (!param) return res.status(404).json({ error: 'Paramètre non trouvé' });
                await param.update(data);
            } else {
                param = await QuaiParameter.create(data);
            }

            if (queueIds && Array.isArray(queueIds)) {
                await param.setQueues(queueIds);
            }

            const updatedParam = await QuaiParameter.findByPk(param.quaiId, {
                include: [{ model: Queue, as: 'queues', attributes: ['queueId', 'name'] }]
            });

            return res.json(updatedParam);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Supprime un paramètre de quai
     */
    async deleteQuaiParameter(req, res) {
        try {
            const { id } = req.params;
            const param = await QuaiParameter.findByPk(id);
            if (!param) return res.status(404).json({ error: 'Paramètre non trouvé' });
            await param.destroy();
            res.json({ message: 'Configuration de quai supprimée' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Suppression groupée de paramètres de quais
     */
    async bulkDeleteQuaiParameters(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { ids } = req.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'Une liste d\'IDs est requise.' });
            }

            await QuaiParameter.destroy({
                where: { quaiId: { [Op.in]: ids } },
                transaction
            });

            await AuditLog.create({
                userId: req.user.userId,
                action: 'BULK_DELETE_QUAI_PARAMETERS',
                details: { count: ids.length, ids },
                ipAddress: req.ip
            }, { transaction });

            await transaction.commit();
            res.json({ message: `${ids.length} configurations de quais supprimées.` });
        } catch (error) {
            if (transaction) await transaction.rollback();
            logger.error('Erreur bulk delete quai parameters:', error);
            res.status(500).json({ error: 'Erreur lors de la suppression groupée.' });
        }
    }
    /**
     * Récupère les quais associés à une étape spécifique
     * Route: GET /quais/available-for-step/:stepId
     */
    async getQuaisByStep(req, res) {
        try {
            const { stepId } = req.params;
            const userId = req.user.userId;
            const role = req.user.role;

            const quais = await QuaiParameter.findAll({
                where: { stepId },
                include: [{ model: Queue, as: 'queues', attributes: ['queueId'] }]
            });

            const filtered = quais.filter(q => {
                if (role === 'ADMINISTRATOR' || role === 'SUPERVISOR') return true;
                const allowed = q.allowedUsers || [];
                return allowed.length === 0 || allowed.includes(userId);
            });

            res.json(filtered.map(q => ({
                quaiId: q.quaiId,
                label: q.label,
                queueIds: q.queues ? q.queues.map(queue => queue.queueId) : []
            })));
        } catch (error) {
            logger.error('Erreur getQuaisByStep:', error);
            res.status(500).json({ error: 'Erreur serveur.' });
        }
    }
}

export default new QuaiController();
