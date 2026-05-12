import { Op, fn, col, literal } from 'sequelize';
import { Ticket, Site, QuaiParameter, Category, TicketActionLog, WorkflowStep } from '../models/index.js';
import logger from '../config/logger.js';

/**
 * Helper pour construire le filtre de site en fonction du rôle et des accès de l'utilisateur
 */
const getSiteFilter = async (user, siteId) => {
    // L'administrateur voit tout par défaut ou filtre par site spécifique
    if (user.role === 'ADMINISTRATOR') {
        if (siteId && siteId !== 'global') return { siteId };
        return {};
    }

    // Si un site spécifique est demandé
    if (siteId && siteId !== 'global') {
        // Optionnel : vérifier ici si l'utilisateur a réellement accès à ce site
        return { siteId };
    }

    // Si "global" est demandé
    // 1. Si l'utilisateur est rattaché à un site précis
    if (user.siteId) {
        return { siteId: user.siteId };
    }

    // 2. Si c'est un Manager rattaché à une compagnie (voit tous les sites de sa compagnie)
    if (user.companyId) {
        const sites = await Site.findAll({ 
            where: { companyId: user.companyId }, 
            attributes: ['siteId'] 
        });
        const siteIds = sites.map(s => s.siteId);
        return { siteId: { [Op.in]: siteIds } };
    }

    // 3. Par défaut, on restreint à son site (même si null)
    return { siteId: user.siteId };
};

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
            if (endDate) end.setHours(23, 59, 59, 999);

            whereClause.arrivedAt = { [Op.between]: [start, end] };

            // Filtre Site (RBAC)
            const siteFilter = await getSiteFilter(user, siteId);
            whereClause = { ...whereClause, ...siteFilter };

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
                QuaiParameter.count({ where: siteId && siteId !== 'global' ? { siteId } : (siteFilter.siteId ? { siteId: siteFilter.siteId } : {}) }),
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

            const siteFilter = await getSiteFilter(user, siteId);
            const whereClause = {
                arrivedAt: { [Op.between]: [start, end] },
                status: 'COMPLETE',
                ...siteFilter
            };

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
            const { user } = req;

            const siteFilter = await getSiteFilter(user, siteId);

            const tickets = await Ticket.findAll({
                where: {
                    arrivedAt: { [Op.between]: [new Date(startDate), new Date(endDate)] },
                    ...siteFilter
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

            const siteFilter = await getSiteFilter(user, siteId);
            let whereClause = { 
                status: 'COMPLETE',
                arrivedAt: { [Op.between]: [start, end] },
                ...siteFilter
            };

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
    },

    /**
     * Liste détaillée des tickets avec tout l'historique des actions
     */
    getDetailedTicketsList: async (req, res) => {
        try {
            const { siteId, startDate, endDate, limit = 500, offset = 0 } = req.query;
            const { user } = req;

            const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
            const end = endDate ? new Date(endDate) : new Date();
            if (endDate) end.setHours(23, 59, 59, 999);

            const siteFilter = await getSiteFilter(user, siteId);
            let whereClause = { 
                status: 'COMPLETE',
                arrivedAt: { [Op.between]: [start, end] },
                ...siteFilter
            };

            const tickets = await Ticket.findAll({
                where: whereClause,
                include: [
                    { model: Site, as: 'site', attributes: ['name'] },
                    { model: Category, as: 'category', attributes: ['name'] },
                    { 
                        model: TicketActionLog, 
                        as: 'actionLogs',
                        include: [{ model: WorkflowStep, as: 'step', attributes: ['name'] }]
                    }
                ],
                order: [
                    ['completedAt', 'DESC'],
                    [{ model: TicketActionLog, as: 'actionLogs' }, 'occurredAt', 'ASC']
                ],
                limit: parseInt(limit) || 500,
                offset: parseInt(offset) || 0
            });

            res.json({ tickets });
        } catch (error) {
            logger.error('Analytics detailed tickets list error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

export default AnalyticsController;


