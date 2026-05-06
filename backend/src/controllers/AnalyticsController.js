import { Op, fn, col, literal } from 'sequelize';
import { Ticket, Site, QuaiParameter, Category } from '../models/index.js';
import logger from '../config/logger.js';

const AnalyticsController = {
    /**
     * KPIs opérationnels avec filtres avancés
     */
    getStats: async (req, res) => {
        try {
            const { siteId, startDate, endDate } = req.query;
            const { user } = req;

            // Construction de la clause WHERE
            let whereClause = {};
            
            // Filtre Date
            const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
            const end = endDate ? new Date(endDate) : new Date();
            
            // Ajuster la fin de journée pour inclure tous les tickets du jour
            if (endDate) end.setHours(23, 59, 59, 999);

            whereClause.arrivedAt = { [Op.between]: [start, end] };
            
            // Filtre Site (RBAC)
            if (user.role !== 'ADMINISTRATOR' && siteId !== 'global') {
                whereClause.siteId = user.siteId;
            } else if (siteId && siteId !== 'global') {
                whereClause.siteId = siteId;
            }

            const [totalTickets, pending, processing, times, totalQuais, occupiedQuais, hourlyVolume, categoryDistribution] = await Promise.all([
                Ticket.count({ where: whereClause }),
                Ticket.count({ where: { ...whereClause, status: 'EN_ATTENTE' } }),
                Ticket.count({ where: { ...whereClause, status: { [Op.in]: ['EN_TRAITEMENT', 'PROCESSING'] } } }),
                Ticket.findAll({
                    attributes: [
                        [fn('AVG', literal('EXTRACT(EPOCH FROM ("calledAt" - "arrivedAt")) / 60')), 'avgWaiting'],
                        [fn('AVG', literal('EXTRACT(EPOCH FROM ("completedAt" - "startedAt")) / 60')), 'avgProcessing'],
                        [fn('AVG', literal('EXTRACT(EPOCH FROM ("completedAt" - "arrivedAt")) / 60')), 'avgTotal']
                    ],
                    where: { ...whereClause, status: 'COMPLETE' },
                    raw: true
                }),
                QuaiParameter.count({ where: siteId && siteId !== 'global' ? { siteId } : {} }),
                Ticket.count({ where: { ...whereClause, status: { [Op.in]: ['EN_TRAITEMENT', 'PROCESSING'] }, quaiId: { [Op.ne]: null } } }),
                Ticket.findAll({
                    attributes: [
                        [fn('DATE_TRUNC', 'hour', col('arrivedAt')), 'hour'],
                        [fn('COUNT', col('ticketId')), 'count']
                    ],
                    where: whereClause,
                    group: [fn('DATE_TRUNC', 'hour', col('arrivedAt'))],
                    order: [[fn('DATE_TRUNC', 'hour', col('arrivedAt')), 'ASC']],
                    raw: true
                }),
                Ticket.findAll({
                    attributes: [
                        'categoryId',
                        [fn('COUNT', col('Ticket.ticketId')), 'count']
                    ],
                    include: [{ model: Category, as: 'category', attributes: ['name'] }],
                    where: whereClause,
                    group: ['Ticket.categoryId', 'category.categoryId', 'category.name'],
                    raw: true,
                    nest: true
                })
            ]);

            const t = times[0] || {};
            const quaiOccupationRate = totalQuais > 0 ? ((occupiedQuais / totalQuais) * 100).toFixed(1) : "0.0";

            res.json({
                summary: {
                    ticketsTotal: totalTickets,
                    trucksInQueue: pending,
                    trucksInLoading: processing,
                    quaiOccupationRate,
                    waitingTime: { avg: parseFloat(t.avgWaiting || 0).toFixed(1) },
                    processingTime: { avg: parseFloat(t.avgProcessing || 0).toFixed(1) },
                    totalTime: { avg: parseFloat(t.avgTotal || 0).toFixed(1) }
                },
                charts: {
                    hourlyVolume: hourlyVolume.map(h => ({
                        time: new Date(h.hour).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        count: parseInt(h.count)
                    })),
                    categories: categoryDistribution.map(c => ({
                        name: c.category?.name || 'Inconnu',
                        value: parseInt(c.count)
                    }))
                }
            });
        } catch (error) {
            logger.error('Analytics stats error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Rapport détaillé par Site et par Quai
     */
    getReports: async (req, res) => {
        try {
            const { startDate, endDate, siteId } = req.query;
            const { user } = req;

            const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
            const end = endDate ? new Date(endDate) : new Date();
            if (endDate) end.setHours(23, 59, 59, 999);

            const whereClause = {
                arrivedAt: { [Op.between]: [start, end] },
                status: 'COMPLETE'
            };

            // Filtre Site (RBAC) - Pour le reporting consolidé ou spécifique
            if (user.role !== 'ADMINISTRATOR' && (!siteId || siteId === 'global')) {
                whereClause.siteId = user.siteId;
            } else if (siteId && siteId !== 'global') {
                whereClause.siteId = siteId;
            }

            const statsBySite = await Ticket.findAll({
                attributes: [
                    'siteId',
                    [fn('COUNT', col('Ticket.ticketId')), 'total'],
                    [fn('AVG', literal('EXTRACT(EPOCH FROM ("Ticket"."completedAt" - "Ticket"."arrivedAt")) / 60')), 'avgDuration']
                ],
                include: [{ 
                    model: Site, 
                    as: 'site', 
                    attributes: ['name'],
                    required: true 
                }],
                where: whereClause,
                group: ['Ticket.siteId', 'site.siteId', 'site.name'],
                raw: true,
                nest: true
            });

            res.json({ statsBySite });
        } catch (error) {
            logger.error('Analytics reports error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Export CSV des données
     */
    exportData: async (req, res) => {
        try {
            const { startDate, endDate, siteId } = req.query;
            const tickets = await Ticket.findAll({
                where: {
                    arrivedAt: { [Op.between]: [new Date(startDate), new Date(endDate)] },
                    ...(siteId && siteId !== 'global' ? { siteId } : {})
                },
                include: [{ model: Site, as: 'site', attributes: ['name'] }],
                order: [['arrivedAt', 'DESC']]
            });

            let csv = 'Ticket,Chauffeur,Site,Arrivée,Appel,Fin,Durée(min)\n';
            tickets.forEach(t => {
                const duration = t.completedAt ? ((new Date(t.completedAt) - new Date(t.arrivedAt)) / 60000).toFixed(1) : '-';
                csv += `${t.ticketNumber},${t.driverName},${t.site?.name},${t.arrivedAt},${t.calledAt || '-'},${t.completedAt || '-'},${duration}\n`;
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=rapport_gfa.csv');
            res.send(csv);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Liste des tickets complétés avec détails
     */
    getTicketsList: async (req, res) => {
        try {
            const { siteId, startDate, endDate, limit = 100, offset = 0 } = req.query;
            const { user } = req;

            const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
            const end = endDate ? new Date(endDate) : new Date();
            if (endDate) end.setHours(23, 59, 59, 999);

            let whereClause = { 
                status: 'COMPLETE',
                arrivedAt: { [Op.between]: [start, end] }
            };

            if (user.role !== 'ADMINISTRATOR' && (!siteId || siteId === 'global')) {
                whereClause.siteId = user.siteId;
            } else if (siteId && siteId !== 'global') {
                whereClause.siteId = siteId;
            }

            const tickets = await Ticket.findAll({
                where: whereClause,
                include: [
                    { model: Site, as: 'site', attributes: ['name'] },
                    { model: Category, as: 'category', attributes: ['name'] }
                ],
                order: [['completedAt', 'DESC']],
                limit: parseInt(limit) || 100,
                offset: parseInt(offset) || 0
            });

            res.json({ tickets });
        } catch (error) {
            logger.error('Analytics tickets list error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};



export default AnalyticsController;

