import { Ticket, Queue, Site, Category } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { Op } from 'sequelize';
import { getSequelizeWhere } from '../utils/caslHelper.js';
import logger from '../config/logger.js';

class AnalyticsController {
    /**
     * Résumé des statistiques globales ou filtrées par site
     */
    getSummary = async (req, res) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Filtrage automatique via CASL
            const ability = req.user.ability;
            const caslWhere = getSequelizeWhere(ability, 'read', 'Analytics');
            
            // On mappe les conditions Analytics vers les champs réels de Ticket
            // Typiquement siteId, companyId, etc.
            const baseWhere = { ...caslWhere };

            const [todayTickets, pendingTickets, completedToday, avgWaitData] = await Promise.all([
                // Tickets créés aujourd'hui
                Ticket.count({ where: { ...baseWhere, arrivedAt: { [Op.gte]: today } } }),
                
                // Tickets en attente (actifs)
                Ticket.count({ where: { ...baseWhere, status: { [Op.in]: ['EN_ATTENTE', 'APPELE', 'EN_TRAITEMENT', 'ISOLE'] } } }),
                
                // Tickets complétés aujourd'hui
                Ticket.count({ where: { ...baseWhere, status: 'COMPLETE', completedAt: { [Op.gte]: today } } }),

                // Temps moyen d'attente (en minutes)
                Ticket.findOne({
                    where: { 
                        ...baseWhere, 
                        status: 'COMPLETE', 
                        startedAt: { [Op.ne]: null },
                        arrivedAt: { [Op.ne]: null }
                    },
                    attributes: [
                        [sequelize.fn('AVG', sequelize.literal('EXTRACT(EPOCH FROM ("startedAt" - "arrivedAt")) / 60')), 'avgWait']
                    ],
                    raw: true
                })
            ]);

            res.json({
                todayTickets,
                pendingTickets,
                completedToday,
                avgWaitTime: Math.round(parseFloat(avgWaitData?.avgWait || 0))
            });
        } catch (error) {
            logger.error('Analytics Summary Error:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération du résumé statistique' });
        }
    }

    /**
     * Calcul des KPIs de performance
     */
    getPerformance = async (req, res) => {
        try {
            const ability = req.user.ability;
            const caslWhere = getSequelizeWhere(ability, 'read', 'Analytics');

            // Calcul sur les tickets complétés des 7 derniers jours par défaut pour avoir du volume
            const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const tickets = await Ticket.findAll({
                where: {
                    ...caslWhere,
                    status: 'COMPLETE',
                    completedAt: { [Op.gte]: lastWeek },
                    startedAt: { [Op.ne]: null },
                    arrivedAt: { [Op.ne]: null }
                },
                attributes: ['completedAt', 'startedAt', 'arrivedAt', 'priority'],
                raw: true
            });

            if (tickets.length === 0) {
                return res.json({ completionRate: 0, efficiency: 0, satisfaction: 0 });
            }

            let totalProcessingTime = 0;
            let totalWaitTime = 0;
            let metSLA = 0;

            tickets.forEach(t => {
                const proc = (new Date(t.completedAt) - new Date(t.startedAt)) / 1000;
                const wait = (new Date(t.startedAt) - new Date(t.arrivedAt)) / 1000;
                totalProcessingTime += proc;
                totalWaitTime += wait;

                // Simple SLA rule: Wait time < 30 min (1800s)
                if (wait < 1800) metSLA++;
            });

            // Formule validée par le user: Traitement / (Attente + Traitement)
            const divisor = (totalProcessingTime + totalWaitTime);
            const efficiency = divisor > 0 ? (totalProcessingTime / divisor) * 100 : 0;
            
            const completionRate = 100; // Puisqu'on ne prend que les complets ici, ou calculer vs total
            const satisfaction = (metSLA / tickets.length) * 100;

            res.json({
                completionRate: Math.round(completionRate),
                efficiency: Math.round(efficiency),
                satisfaction: Math.round(satisfaction)
            });
        } catch (error) {
            logger.error('Analytics Performance Error:', error);
            res.status(500).json({ error: 'Erreur lors du calcul des performances' });
        }
    }
}

export default new AnalyticsController();
