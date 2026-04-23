import { Op, fn, col, literal } from 'sequelize';
import { Ticket, Site, QuaiParameter } from '../models/index.js';
import logger from '../config/logger.js';

const AnalyticsController = {
    /**
     * KPIs opérationnels avec filtre de site (US-035)
     */
    getStats: async (req, res) => {
        try {
            const { siteId } = req.query;
            const { user } = req; // Injecté par authMiddleware

            // RBAC & Site Filtering
            let whereClause = { arrivedAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) } };
            
            if (user.role !== 'ADMINISTRATOR' && siteId !== 'global') {
                whereClause.siteId = user.siteId;
            } else if (siteId && siteId !== 'global') {
                whereClause.siteId = siteId;
            }

            const [today, pending, processing, times, totalQuais, occupiedQuais] = await Promise.all([
                Ticket.count({ where: whereClause }),
                Ticket.count({ where: { ...whereClause, status: 'EN_ATTENTE' } }),
                Ticket.count({ where: { ...whereClause, status: { [Op.in]: ['EN_TRAITEMENT', 'PROCESSING'] } } }),
                Ticket.findAll({
                    attributes: [
                        [fn('AVG', literal('EXTRACT(EPOCH FROM ("calledAt" - "arrivedAt")) / 60')), 'avgWaiting'],
                        [fn('MIN', literal('EXTRACT(EPOCH FROM ("calledAt" - "arrivedAt")) / 60')), 'minWaiting'],
                        [fn('MAX', literal('EXTRACT(EPOCH FROM ("calledAt" - "arrivedAt")) / 60')), 'maxWaiting'],
                        [fn('AVG', literal('EXTRACT(EPOCH FROM ("completedAt" - "startedAt")) / 60')), 'avgProcessing'],
                        [fn('MIN', literal('EXTRACT(EPOCH FROM ("completedAt" - "startedAt")) / 60')), 'minProcessing'],
                        [fn('MAX', literal('EXTRACT(EPOCH FROM ("completedAt" - "startedAt")) / 60')), 'maxProcessing'],
                        [fn('AVG', literal('EXTRACT(EPOCH FROM ("completedAt" - "arrivedAt")) / 60')), 'avgTotal'],
                        [fn('MIN', literal('EXTRACT(EPOCH FROM ("completedAt" - "arrivedAt")) / 60')), 'minTotal'],
                        [fn('MAX', literal('EXTRACT(EPOCH FROM ("completedAt" - "arrivedAt")) / 60')), 'maxTotal']
                    ],
                    where: { ...whereClause, status: 'COMPLETE' },
                    raw: true
                }),
                QuaiParameter.count({ where: siteId && siteId !== 'global' ? { siteId } : {} }),
                Ticket.count({ where: { ...whereClause, status: { [Op.in]: ['EN_TRAITEMENT', 'PROCESSING'] }, quaiId: { [Op.ne]: null } } })
            ]);

            const t = times[0] || {};
            const quaiOccupationRate = totalQuais > 0 ? ((occupiedQuais / totalQuais) * 100).toFixed(1) : "0.0";

            res.json({
                summary: {
                    ticketsToday: today,
                    trucksInQueue: pending,
                    trucksInLoading: processing,
                    quaiOccupationRate,
                    waitingTime: { avg: parseFloat(t.avgWaiting || 0).toFixed(1), min: parseFloat(t.minWaiting || 0).toFixed(1), max: parseFloat(t.maxWaiting || 0).toFixed(1) },
                    processingTime: { avg: parseFloat(t.avgProcessing || 0).toFixed(1), min: parseFloat(t.minProcessing || 0).toFixed(1), max: parseFloat(t.maxProcessing || 0).toFixed(1) },
                    totalTime: { avg: parseFloat(t.avgTotal || 0).toFixed(1), min: parseFloat(t.minTotal || 0).toFixed(1), max: parseFloat(t.maxTotal || 0).toFixed(1) }
                }
            });
        } catch (error) {
            logger.error('Analytics stats error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    /**
     * Liste détaillée des tickets pour un site (US-035)
     */
    getSiteDetails: async (req, res) => {
        try {
            const { siteId } = req.query;
            const { user } = req;

            const whereClause = (user.role !== 'ADMINISTRATOR') ? { siteId: user.siteId } : (siteId && siteId !== 'global' ? { siteId } : {});

            const tickets = await Ticket.findAll({
                attributes: [
                    'ticketNumber', 'licensePlate', 
                    ['arrivedAt', 'entryTime'], 
                    ['completedAt', 'exitTime'],
                    [literal('EXTRACT(EPOCH FROM ("completedAt" - "arrivedAt")) / 60'), 'duration']
                ],
                where: whereClause,
                order: [['arrivedAt', 'DESC']],
                limit: 100
            });

            res.json(tickets);
        } catch (error) {
            logger.error('Analytics details error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export default AnalyticsController;
