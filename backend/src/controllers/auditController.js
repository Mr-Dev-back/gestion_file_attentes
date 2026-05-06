import { AuditLog, User } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class AuditController {
    /**
     * Récupère la liste des logs d'audit avec filtrage et pagination
     */
    async getLogs(req, res) {
        try {
            const { 
                page = 1, 
                limit = 50, 
                userId, 
                action, 
                resourceType, 
                startDate, 
                endDate,
                search
            } = req.query;

            const offset = (page - 1) * limit;
            const where = {};
            const userIncludeWhere = {};

            // Security: Manager only sees logs from their site
            if (req.user.role === 'MANAGER' && req.user.siteId) {
                userIncludeWhere.siteId = req.user.siteId;
            }

            if (userId) where.userId = userId;
            if (action) where.action = action;
            if (resourceType) where.resourceType = resourceType;
            
            if (startDate || endDate) {
                where.occurredAt = {};
                if (startDate) where.occurredAt[Op.gte] = new Date(startDate);
                if (endDate) where.occurredAt[Op.lte] = new Date(endDate);
            }

            if (search) {
                where[Op.or] = [
                    { action: { [Op.iLike]: `%${search}%` } },
                    { resourceType: { [Op.iLike]: `%${search}%` } },
                    { resourceId: { [Op.iLike]: `%${search}%` } }
                ];
            }

            const queryOptions = {
                where,
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'username', 'email', 'firstName', 'lastName', 'siteId'],
                    where: userIncludeWhere,
                    required: !!userIncludeWhere.siteId
                }],
                order: [['occurredAt', 'DESC']]
            };

            if (limit !== 'all') {
                queryOptions.limit = parseInt(limit);
                queryOptions.offset = parseInt(offset);
            }

            const { count, rows: logs } = await AuditLog.findAndCountAll(queryOptions);

            res.json({
                total: count,
                pages: limit === 'all' ? 1 : Math.ceil(count / limit),
                currentPage: parseInt(page),
                logs
            });
        } catch (error) {
            logger.error('Error fetching audit logs:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des logs d\'audit.' });
        }
    }

    /**
     * Liste des types d'actions disponibles pour le filtre
     */
    async getActionTypes(req, res) {
        try {
            const actions = await AuditLog.findAll({
                attributes: [[AuditLog.sequelize.fn('DISTINCT', AuditLog.sequelize.col('action')), 'action']],
                order: [['action', 'ASC']]
            });
            res.json(actions.map(a => a.action));
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la récupération des types d\'actions.' });
        }
    }
}

export default new AuditController();
