import Site from '../models/Site.js';
import { Ticket, WorkflowStep, Queue, Category } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class PublicDisplayController {
    constructor() {
        this.cache = {
            data: null,
            timestamp: 0,
            expiry: 2000 // 2 seconds
    };
    }

    /**
     * Get list of all sites (Public, limited data)
     */
    getSites = async (req, res) => {
        try {
            logger.info('[PublicDisplayController] Fetching all sites...');
            if (!Site) {
                logger.error('[PublicDisplayController] Site model is UNDEFINED!');
                return res.status(500).json({ error: 'Model initialization error.' });
            }
            const sites = await Site.findAll({
                attributes: ['siteId', 'name'],
                order: [['name', 'ASC']]
            });
            logger.info(`[PublicDisplayController] Found ${sites.length} sites.`);
            res.json(sites);
        } catch (error) {
            logger.error('[PublicDisplayController] Error fetching public sites:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des sites.', detail: error.message });
        }
    }

    /**
     * Get display data for a site
     */
    getDisplayData = async (req, res) => {
        try {
            const { siteId } = req.params;

            // Validation simple de l'UUID pour éviter le crash DB
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!siteId || !uuidRegex.test(siteId)) {
                return res.json({ called: [], waiting: [] });
            }

            // Fetch Called Tickets
            const calledTickets = await Ticket.findAll({
                where: {
                    siteId,
                    status: 'CALLING'
                },
                include: [
                    { 
                        model: WorkflowStep, 
                        as: 'currentStep'
                    },
                    {
                        model: Queue,
                        as: 'queue',
                        attributes: ['name']
                    }
                ],
                order: [['calledAt', 'DESC']],
                limit: 5 
            });

            // Fetch Next Waiting Tickets
            const waitingTickets = await Ticket.findAll({
                where: {
                    siteId,
                    status: { [Op.in]: ['EN_ATTENTE', 'ISOLE', 'EN_TRAITEMENT', 'PROCESSING'] }
                },
                include: [
                    {
                        model: Category,
                        as: 'category',
                        attributes: ['name']
                    }
                ],
                order: [
                    ['priority', 'DESC'],
                    ['arrivedAt', 'ASC']
                ],
                limit: 30
            });

            const site = await Site.findByPk(siteId, { attributes: ['name'] });

            const waitingList = waitingTickets.filter(t => t.status !== 'ISOLE');
            const isolatedList = waitingTickets.filter(t => t.status === 'ISOLE');

            const responseData = {
                siteName: site?.name || '',
                called: calledTickets.map(t => ({
                    ticketId: t.ticketId,
                    ticketNumber: t.ticketNumber,
                    priority: t.priority,
                    licensePlate: t.licensePlate,
                    destination: t.queue?.name || t.currentStep?.name || 'ZONE DE CONTRÔLE',
                    calledAt: t.calledAt
                })),
                waiting: waitingList.map(t => ({
                    ticketId: t.ticketId,
                    ticketNumber: t.ticketNumber,
                    priority: t.priority,
                    licensePlate: t.licensePlate,
                    status: t.status,
                    categoryName: t.category?.name
                })),
                isolated: isolatedList.map(t => ({
                    ticketId: t.ticketId,
                    ticketNumber: t.ticketNumber,
                    priority: t.priority,
                    licensePlate: t.licensePlate,
                    status: t.status,
                    categoryName: t.category?.name
                }))
            };

            res.json(responseData);
        } catch (error) {
            logger.error('Error fetching public display data:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des données d\'affichage.' });
        }
    }
}

export default new PublicDisplayController();
