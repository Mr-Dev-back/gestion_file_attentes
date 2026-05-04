import { Op } from 'sequelize';
import { Ticket, TicketVehicleInfo, WorkflowStep } from '../models/index.js';
import auditService from '../services/auditService.js';
import logger from '../config/logger.js';

class TrackingController {
    /**
     * Recherche la localisation d'un véhicule sur site via son matricule.
     * @route GET /api/tracking/search/:plateNumber
     */
    async searchVehicle(req, res) {
        try {
            const { plateNumber } = req.params;

            const ticket = await Ticket.findOne({
                where: {
                    status: {
                        [Op.notIn]: ['COMPLETE', 'ANNULE']
                    }
                },
                include: [
                    {
                        model: TicketVehicleInfo,
                        as: 'vehicleInfo',
                        where: {
                            licensePlate: plateNumber
                        }
                    },
                    {
                        model: WorkflowStep,
                        as: 'currentStep',
                        attributes: ['name']
                    }
                ]
            });

            if (!ticket) {
                return res.status(404).json({
                    error: 'Véhicule non trouvé ou aucun ticket actif pour ce matricule.'
                });
            }

            // Log d'audit pour cette recherche (SUPERVISOR)
            await auditService.logAction(
                req,
                'VEHICLE_TRACKING_SEARCH',
                'Ticket',
                ticket.ticketId,
                null,
                { searchedPlateNumber: plateNumber }
            );

            return res.json({
                plateNumber: ticket.vehicleInfo.licensePlate,
                ticketNumber: ticket.ticketNumber,
                currentStep: ticket.currentStep ? ticket.currentStep.name : 'Inconnu',
                updatedAt: ticket.updatedAt
            });

        } catch (error) {
            logger.error('[TRACKING CONTROLLER] Erreur lors de la recherche du véhicule:', error);
            return res.status(500).json({ error: 'Erreur lors de la recherche du véhicule.' });
        }
    }

    debugLatest = async (req, res) => {
        try {
            const tickets = await Ticket.findAll({ order: [['arrivedAt', 'DESC']], limit: 1 });
            if (!tickets.length) return res.json({ error: 'No tickets' });
            const ticket = tickets[0];
            const step = await WorkflowStep.findByPk(ticket.currentStepId, { include: ['queues'] });
            res.json({ ticket, step });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}

export default new TrackingController();
