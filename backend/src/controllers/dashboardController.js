import User from '../models/User.js';
import { AuditLog, Ticket, Queue, Category, WorkflowStep, Kiosk, TicketVehicleInfo } from '../models/index.js';
import Site from '../models/Site.js';
import { sequelize } from '../config/database.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class DashboardController {
    /**
     * Admin Dashboard Statistics
     */
    getAdminStats = async (req, res) => {
        const stats = {
            activeUsers: 0,
            activeTickets: 0,
            todayEntries: 0,
            systemHealth: {
                database: 'healthy',
                api: 'healthy',
                websocket: 'healthy',
                sageX3: 'healthy'
            }
        };

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            try {
                stats.activeUsers = await User.count({ where: { isActive: true } });
            } catch (e) { logger.error('Error counting active users:', e); }

            try {
                stats.activeTickets = await Ticket.count({
                    where: { status: { [Op.notIn]: ['COMPLETE', 'ANNULE'] } }
                });
            } catch (e) { logger.error('Error counting active tickets:', e); }

            try {
                stats.todayEntries = await Ticket.count({
                    where: { arrivedAt: { [Op.gte]: today } }
                });
            } catch (e) { logger.error('Error counting today entries:', e); }

            res.status(200).json(stats);
        } catch (error) {
            logger.error('Error fetching admin stats:', error);
            res.status(500).json({ error: 'Error fetching admin statistics' });
        }
    }

    /**
     * Admin Recent Activity
     */
    getAdminRecentActivity = async (req, res) => {
        try {
            const recentLogs = await AuditLog.findAll({
                limit: 10,
                order: [['occurredAt', 'DESC']],
                include: [{ model: User, as: 'user', attributes: ['email', 'firstName', 'lastName'] }]
            });

            const activities = recentLogs.map(log => ({
                auditLogId: log.auditId,
                title: log.action,
                description: this.formatActivityDescription(log),
                timestamp: log.occurredAt,
                type: this.getActivityType(log.action),
                user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Système'
            }));

            res.status(200).json({ activities });
        } catch (error) {
            logger.error('Error fetching admin activity:', error);
            res.status(200).json({ activities: [] });
        }
    }

    /**
     * Admin Dashboard Overview (Advanced version)
     */
    getAdminOverview = async (req, res) => {
        try {
            const { siteId } = req.query;
            const whereSite = (siteId && siteId !== '') ? { siteId } : {};

            logger.info('Fetching Admin Overview for siteId:', siteId || 'Global');

            // 1. Vitals
            const io = req.app.get('io');
            let databaseStatus = 'unhealthy';
            try {
                await sequelize.authenticate();
                databaseStatus = 'healthy';
            } catch (authError) {
                logger.error('DB Auth Error in Overview:', authError.message);
            }

            const vitals = {
                api: 'healthy',
                database: databaseStatus,
                realtime: io ? 'healthy' : 'unhealthy',
                vocal: 'healthy'
            };

            // 2. KPIs
            const oneHourAgo = new Date(Date.now() - 3600000);
            
            let counts = [0, 0, 0, 0, 0];
            try {
                counts = await Promise.all([
                    User.count({ where: { isActive: true } }),
                    Ticket.count({ where: { ...whereSite, status: { [Op.notIn]: ['COMPLETE', 'ANNULE'] } } }),
                    AuditLog.count({ where: { action: { [Op.iLike]: '%ERROR%' }, occurredAt: { [Op.gte]: oneHourAgo } } }),
                    AuditLog.count({ where: { occurredAt: { [Op.gte]: oneHourAgo } } }),
                    AuditLog.count({ where: { action: { [Op.iLike]: '%ERROR%' } } })
                ]);
            } catch (kpiError) {
                logger.error('KPI Fetch Error in Overview:', kpiError);
            }

            const [activeSessions, activeTickets, errorCountLastHour, totalLogsLastHour, criticalAlerts] = counts;

            const kpis = {
                activeSessions,
                activeTickets,
                apiErrorRate: totalLogsLastHour > 0 ? (errorCountLastHour / totalLogsLastHour) * 100 : 0,
                criticalAlerts
            };

            // 3. Hardware (Kiosks)
            let hardware = [];
            try {
                hardware = await Kiosk.findAll({
                    where: whereSite,
                    include: [{ model: Site, as: 'site', attributes: ['name'] }]
                });
            } catch (hardwareError) {
                logger.error('Hardware Fetch Error in Overview:', hardwareError);
            }

            // 4. Audit Stream
            let auditStream = [];
            try {
                const auditLogs = await AuditLog.findAll({
                    limit: 20,
                    order: [['occurredAt', 'DESC']],
                    include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
                });

                auditStream = auditLogs.map(log => ({
                    id: log.auditId,
                    user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Système',
                    action: log.action,
                    details: this.formatActivityDescription(log),
                    timestamp: log.occurredAt,
                    color: this.getActivityColorHex(log.action)
                }));
            } catch (auditError) {
                logger.error('Audit Stream Fetch Error in Overview:', auditError);
            }

            // 5. Charts
            const charts = { ticketTrend: [], categoryDistribution: [] };
            try {
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000);
                
                const ticketTrendRaw = await Ticket.findAll({
                    where: {
                        ...whereSite,
                        arrivedAt: { [Op.gte]: twentyFourHoursAgo }
                    },
                    attributes: [
                        [sequelize.fn('date_trunc', 'hour', sequelize.col('arrivedAt')), 'hour'],
                        [sequelize.fn('count', sequelize.col('ticketId')), 'count']
                    ],
                    group: [sequelize.fn('date_trunc', 'hour', sequelize.col('arrivedAt'))],
                    order: [[sequelize.fn('date_trunc', 'hour', sequelize.col('arrivedAt')), 'ASC']],
                    raw: true
                });

                charts.ticketTrend = ticketTrendRaw.map(t => ({
                    time: new Date(t.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    count: parseInt(t.count)
                }));

                const categoryDistRaw = await Ticket.findAll({
                    where: whereSite,
                    attributes: [
                        'categoryId',
                        [sequelize.fn('count', sequelize.col('ticketId')), 'count']
                    ],
                    include: [{ model: Category, as: 'category', attributes: ['name', 'color'] }],
                    group: ['Ticket.categoryId', 'category.categoryId', 'category.name', 'category.color'],
                    raw: true,
                    nest: true
                });

                charts.categoryDistribution = categoryDistRaw.map(item => ({
                    name: item.category?.name || 'Inconnu',
                    value: parseInt(item.count),
                    color: item.category?.color || '#3b82f6'
                }));
            } catch (chartsError) {
                logger.error('Charts Fetch Error in Overview:', chartsError);
            }

            res.status(200).json({
                vitals,
                kpis,
                hardware,
                auditStream,
                charts
            });
        } catch (error) {
            logger.error('Fatal Error in getAdminOverview:', error);
            res.status(500).json({ error: 'Erreur critique lors de la récupération de la vue d\'ensemble' });
        }
    }

    getActivityColorHex = (action) => {
        const a = action.toUpperCase();
        if (a.includes('LOGIN') || a.includes('LOGOUT') || a.includes('CONNECT')) return '#3b82f6';
        if (a.includes('UPDATE') || a.includes('CREATE') || a.includes('DELETE') || a.includes('CONFIG')) return '#eab308';
        if (a.includes('ERROR') || a.includes('FAIL') || a.includes('SECURITY') || a.includes('LOCKED')) return '#ef4444';
        return '#64748b';
    }

    /**
     * Supervisor Dashboard Statistics
     */
    getSupervisorStats = async (req, res) => {
        const stats = {
            activeTickets: 0,
            completedToday: 0,
            avgWaitTime: 15
        };

        try {
            const { siteId } = req.query;
            const where = siteId ? { siteId } : {};
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            try {
                stats.activeTickets = await Ticket.count({
                    where: {
                        ...where,
                        status: { [Op.notIn]: ['COMPLETE', 'ANNULE'] }
                    }
                });
            } catch (e) { logger.error('Error counting supervisor active tickets:', e); }

            try {
                stats.completedToday = await Ticket.count({
                    where: {
                        ...where,
                        status: 'COMPLETE',
                        arrivedAt: { [Op.gte]: today }
                    }
                });
            } catch (e) { logger.error('Error counting supervisor completed today:', e); }

            res.status(200).json(stats);
        } catch (error) {
            logger.error('Error fetching supervisor stats:', error);
            res.status(500).json({ error: 'Error fetching supervisor statistics' });
        }
    }

    /**
     * Supervisor Departments Visualization
     */
    getSupervisorDepartments = async (req, res) => {
        try {
            const siteId = req.query.siteId || req.user.siteId;
            if (!siteId) return res.status(200).json({ departments: [] });

            const stats = await Ticket.findAll({
                where: { 
                    siteId,
                    status: { [Op.notIn]: ['COMPLETE', 'ANNULE'] }
                },
                attributes: [
                    [sequelize.col('currentStep.name'), 'department'],
                    [sequelize.fn('COUNT', sequelize.col('Ticket.ticketId')), 'ticketCount']
                ],
                include: [{
                    model: WorkflowStep,
                    as: 'currentStep',
                    attributes: []
                }],
                group: [sequelize.col('currentStep.stepId'), sequelize.col('currentStep.name')],
                raw: true,
                nest: true
            });

            res.status(200).json({
                departments: stats.map(s => ({
                    name: s.department || 'Non assigné',
                    tickets: parseInt(s.ticketCount),
                    pending: parseInt(s.ticketCount),
                    color: 'bg-indigo-500'
                }))
            });
        } catch (error) {
            logger.error('Error fetching supervisor departments:', error);
            res.status(200).json({ departments: [] });
        }
    }

    /**
     * Supervisor Queues Visualization
     */
    getSupervisorQueues = async (req, res) => {
        try {
            const { siteId } = req.query;
            const isManagerOrAdmin = ['MANAGER', 'ADMINISTRATOR'].includes(req.user.role);

            const siteWhere = siteId ? { siteId } : (isManagerOrAdmin ? {} : { siteId: req.user.siteId });

            const sites = await Site.findAll({ where: siteWhere });
            if (sites.length === 0) return res.json([]);

            const allQueues = [];

            for (const site of sites) {
                if (!site.workflowId) continue;

                const steps = await WorkflowStep.findAll({
                    where: { workflowId: site.workflowId },
                    include: [{ 
                        model: Queue, 
                        as: 'queues',
                        include: [{ model: Category, as: 'category', attributes: ['categoryId', 'name', 'color'] }]
                    }]
                });

                const queuesMap = {};
                for (const step of steps) {
                    const stepQueues = step.queues || [];
                    for (const queue of stepQueues) {
                        if (!queuesMap[queue.queueId]) {
                            queuesMap[queue.queueId] = {
                                queueId: queue.queueId,
                                name: queue.name,
                                siteId: site.siteId,
                                siteName: site.name,
                                truckCount: 0,
                                tickets: []
                            };
                        }
                    }
                }

                const tickets = await Ticket.findAll({
                    where: {
                        siteId: site.siteId,
                        status: { [Op.in]: ['EN_ATTENTE', 'APPELE', 'EN_TRAITEMENT', 'ISOLE'] },
                        currentStepId: { [Op.ne]: null }
                    },
                    include: [
                        { model: Category, as: 'category' },
                        { model: WorkflowStep, as: 'currentStep' }
                    ],
                    order: [['priority', 'DESC'], ['arrivedAt', 'ASC']]
                });

                for (const ticket of tickets) {
                    const qId = ticket.queueId;
                    if (qId && queuesMap[qId]) {
                        queuesMap[qId].tickets.push({
                            ticketId: ticket.ticketId,
                            ticketNumber: ticket.ticketNumber,
                            priority: ticket.priority,
                            status: ticket.status,
                            arrivedAt: ticket.arrivedAt,
                            vehicleInfo: { licensePlate: ticket.licensePlate },
                            estimatedWaitTime: Math.max(5, (queuesMap[qId].tickets.length + 1) * 10),
                            position: queuesMap[qId].tickets.length + 1
                        });
                        queuesMap[qId].truckCount++;
                    }
                }

                allQueues.push(...Object.values(queuesMap));
            }

            // Final deduplication across sites (if any queue is shared)
            const finalQueues = Array.from(new Map(allQueues.map(q => [q.queueId, q])).values());
            res.json(finalQueues);
        } catch (error) {
            logger.error('Error in getSupervisorQueues:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des files superviseur.' });
        }
    }

    /**
     * Manager Dashboard Statistics
     */
    getManagerStats = async (req, res) => {
        try {
            const { siteId } = req.query;
            const isManagerOrAdmin = ['MANAGER', 'ADMINISTRATOR'].includes(req.user.role);
            const whereSite = siteId ? { siteId } : (isManagerOrAdmin ? {} : { siteId: req.user.siteId });

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [todayTickets, pendingTickets, completedToday] = await Promise.all([
                Ticket.count({ where: { ...whereSite, arrivedAt: { [Op.gte]: today } } }),
                Ticket.count({ where: { ...whereSite, status: { [Op.notIn]: ['COMPLETE', 'ANNULE'] } } }),
                Ticket.count({ where: { ...whereSite, status: 'COMPLETE', completedAt: { [Op.gte]: today } } }),
            ]);

            const calledTickets = await Ticket.findAll({
                where: {
                    ...whereSite,
                    arrivedAt: { [Op.gte]: today },
                    calledAt: { [Op.ne]: null }
                },
                attributes: ['arrivedAt', 'calledAt'],
                limit: 2000
            });

            let avgWaitTime = 0;
            if (calledTickets.length > 0) {
                const totalMinutes = calledTickets.reduce((acc, t) => {
                    const arrived = new Date(t.arrivedAt).getTime();
                    const called = new Date(t.calledAt).getTime();
                    if (!Number.isFinite(arrived) || !Number.isFinite(called) || called < arrived) return acc;
                    return acc + Math.round((called - arrived) / 60000);
                }, 0);
                avgWaitTime = Math.round(totalMinutes / calledTickets.length);
            }

            res.status(200).json({
                todayTickets,
                pendingTickets,
                completedToday,
                avgWaitTime
            });
        } catch (error) {
            logger.error('Error fetching manager stats:', error);
            res.status(500).json({ error: 'Error fetching manager statistics' });
        }
    }

    getManagerPerformance = async (req, res) => {
        try {
            const { siteId } = req.query;
            const isManagerOrAdmin = ['MANAGER', 'ADMINISTRATOR'].includes(req.user.role);
            const whereSite = (siteId && siteId !== '') ? { siteId } : (isManagerOrAdmin ? {} : { siteId: req.user.siteId });

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [todayTickets, completedToday] = await Promise.all([
                Ticket.count({ where: { ...whereSite, arrivedAt: { [Op.gte]: today } } }),
                Ticket.count({ where: { ...whereSite, status: 'COMPLETE', completedAt: { [Op.gte]: today } } }),
            ]);

            const completionRate = todayTickets > 0 ? Math.round((completedToday / todayTickets) * 100) : 0;

            const completed = await Ticket.findAll({
                where: { ...whereSite, status: 'COMPLETE', completedAt: { [Op.gte]: today } },
                attributes: ['arrivedAt', 'completedAt'],
                limit: 2000
            });

            let avgTotalMinutes = 0;
            if (completed.length > 0) {
                const totalMinutes = completed.reduce((acc, t) => {
                    const arrived = new Date(t.arrivedAt).getTime();
                    const done = new Date(t.completedAt).getTime();
                    if (!Number.isFinite(arrived) || !Number.isFinite(done) || done < arrived) return acc;
                    return acc + Math.round((done - arrived) / 60000);
                }, 0);
                avgTotalMinutes = Math.round(totalMinutes / completed.length);
            }

            const efficiency =
                avgTotalMinutes === 0 ? 0 :
                    avgTotalMinutes <= 60 ? 90 :
                        avgTotalMinutes <= 90 ? 80 :
                            avgTotalMinutes <= 120 ? 70 : 55;

            const satisfaction =
                completionRate >= 80 ? 90 :
                    completionRate >= 60 ? 80 :
                        completionRate >= 40 ? 70 : 60;

            res.status(200).json({
                metrics: [],
                completionRate,
                efficiency,
                satisfaction
            });
        } catch (error) {
            logger.error('Error fetching manager performance:', error);
            res.status(200).json({ metrics: [], completionRate: 0, efficiency: 0, satisfaction: 0 });
        }
    }

    /**
     * Manager Distribution Data
     */
    getManagerDistribution = async (req, res) => {
        try {
            const { siteId } = req.query;
            const isManagerOrAdmin = ['MANAGER', 'ADMINISTRATOR'].includes(req.user.role);
            const whereSite = (siteId && siteId !== '') ? { siteId } : (isManagerOrAdmin ? {} : { siteId: req.user.siteId });

            const stats = await Ticket.findAll({
                where: whereSite,
                attributes: [
                    'categoryId',
                    [sequelize.fn('COUNT', sequelize.col('Ticket.ticketId')), 'count']
                ],
                include: [{ model: Category, as: 'category', attributes: ['name', 'color'] }],
                group: ['Ticket.categoryId', 'category.categoryId', 'category.name', 'category.color'],
                raw: true,
                nest: true
            });

            const distribution = stats.map(s => ({
                name: s.category?.name || 'Inconnu',
                value: parseInt(s.count),
                color: s.category?.color || '#3b82f6'
            }));

            res.status(200).json({ distribution });
        } catch (error) {
            logger.error('Error in getManagerDistribution:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération de la distribution' });
        }
    }

    /**
     * Manager Site Comparison Data
     */
    getManagerSiteComparison = async (req, res) => {
        try {
            const stats = await Ticket.findAll({
                attributes: [
                    [sequelize.col('site.name'), 'site'],
                    [sequelize.col('category.name'), 'category'],
                    [sequelize.fn('COUNT', sequelize.col('Ticket.ticketId')), 'count']
                ],
                include: [
                    { model: Site, as: 'site', attributes: [] },
                    { model: Category, as: 'category', attributes: [] }
                ],
                group: [sequelize.col('site.name'), sequelize.col('category.name')],
                raw: true
            });

            const formattedMap = stats.reduce((acc, s) => {
                const siteName = s.site || 'Inconnu';
                const categoryName = s.category || 'Autre';
                if (!acc[siteName]) acc[siteName] = { site: siteName };
                acc[siteName][categoryName] = parseInt(s.count);
                return acc;
            }, {});

            res.status(200).json(Object.values(formattedMap));
        } catch (error) {
            logger.error('Error in getManagerSiteComparison:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération du comparatif par site' });
        }
    }

    /**
     * Manager Regional Logistic Map Stats
     * Aggregates vehicle counts by origin region
     */
    getMapStats = async (req, res) => {
        try {
            // Stats grouping by origin region from TicketVehicleInfo
            const stats = await TicketVehicleInfo.findAll({
                attributes: [
                    'originRegion',
                    [sequelize.fn('COUNT', sequelize.col('TicketVehicleInfo.ticketId')), 'total'],
                    [sequelize.literal(`COUNT(CASE WHEN "ticket"."status" = 'COMPLETE' THEN 1 END)`), 'arrived'],
                    [sequelize.literal(`COUNT(CASE WHEN "ticket"."status" NOT IN ('COMPLETE', 'ANNULE') THEN 1 END)`), 'enRoute']
                ],
                include: [{
                    model: Ticket,
                    as: 'ticket',
                    attributes: [],
                    where: { status: { [Op.ne]: 'ANNULE' } }
                }],
                where: {
                    originRegion: { [Op.ne]: null }
                },
                group: ['originRegion'],
                raw: true
            });

            // Map data for Frontend consumption
            const regionsData = stats.map(s => ({
                region: s.originRegion,
                total: parseInt(s.total),
                arrived: parseInt(s.arrived),
                enRoute: parseInt(s.enRoute)
            }));

            res.status(200).json(regionsData);
        } catch (error) {
            logger.error('Error in getMapStats:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des statistiques régionales' });
        }
    }

    /**
     * Sales Dashboard Statistics
     */
    getSalesStats = async (req, res) => {
        try {
            const { siteId } = req.query;
            const where = siteId ? { siteId } : {};
            
            const totalSales = await Ticket.count({
                where: {
                    ...where,
                    status: 'COMPLETE'
                }
            });

            const pendingOrders = await Ticket.count({
                where: {
                    ...where,
                    status: { [Op.in]: ['EN_ATTENTE', 'APPELE', 'EN_TRAITEMENT'] }
                }
            });

            res.status(200).json({
                totalSales,
                pendingOrders
            });
        } catch (error) {
            logger.error('Error fetching sales stats:', error);
            res.status(500).json({ error: 'Error fetching sales statistics' });
        }
    }

    /**
     * Sales Summary for Dashboard
     */
    getSalesSummary = async (req, res) => {
        try {
            const { siteId } = req.query;
            const where = siteId ? { siteId } : {};
            
            const summary = await Ticket.findAll({
                where: {
                    ...where,
                    status: 'COMPLETE'
                },
                attributes: [
                    [sequelize.col('category.name'), 'category'],
                    [sequelize.fn('COUNT', sequelize.col('ticketId')), 'count']
                ],
                include: [{ model: Category, as: 'category', attributes: [] }],
                group: [sequelize.col('category.name')],
                limit: 5
            });

            res.status(200).json({
                summary: summary.map(s => ({
                    name: s.getDataValue('category'),
                    count: parseInt(s.getDataValue('count'))
                }))
            });
        } catch (error) {
            logger.error('Error fetching sales summary:', error);
            res.status(200).json({ summary: [] });
        }
    }

    /**
     * Control Dashboard Statistics
     */
    getControlStats = async (req, res) => {
        try {
            const { siteId } = req.query;
            const where = siteId ? { siteId } : {};

            const ticketsWaiting = await Ticket.count({
                where: {
                    ...where,
                    status: 'EN_ATTENTE'
                }
            });

            const ticketsCalled = await Ticket.count({
                where: {
                    ...where,
                    status: 'APPELE'
                }
            });

            res.status(200).json({
                ticketsWaiting,
                ticketsCalled
            });
        } catch (error) {
            logger.error('Error fetching control stats:', error);
            res.status(500).json({ error: 'Error fetching control statistics' });
        }
    }

    /**
     * Control Pending Tickets
     */
    getControlPending = async (req, res) => {
        try {
            const { siteId } = req.query;
            const where = siteId ? { siteId } : {};

            const pending = await Ticket.findAll({
                where: {
                    ...where,
                    status: 'EN_ATTENTE'
                },
                include: [{ model: Category, as: 'category' }],
                order: [['priority', 'DESC'], ['arrivedAt', 'ASC']],
                limit: 10
            });

            res.status(200).json({ pending });
        } catch (error) {
            logger.error('Error fetching control pending:', error);
            res.status(200).json({ pending: [] });
        }
    }

    formatActivityDescription = (log) => {
        if (!log.details) return '';
        if (typeof log.details === 'string') return log.details;
        return JSON.stringify(log.details);
    }

    getActivityType = (action) => {
        if (action.includes('CREATE')) return 'success';
        if (action.includes('UPDATE')) return 'info';
        if (action.includes('DELETE')) return 'warning';
        if (action.includes('ERROR') || action.includes('FAILED')) return 'error';
        return 'info';
    }
}

export default new DashboardController();
