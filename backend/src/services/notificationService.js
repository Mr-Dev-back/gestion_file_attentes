import { Ticket, WorkflowStep, SystemSetting } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class NotificationService {
    /**
     * Émet des mises à jour de ticket via Socket.io avec gestion audio
     */
    async emitTicketUpdate(app, ticket, event = 'ticket_updated') {
        const io = app.get('io');
        if (!io) {
            logger.warn('Socket.io instance not found in app');
            return;
        }

        const siteRoom = `site_${ticket.siteId}`;
        const payload = {
            event,
            ticket,
            timestamp: new Date()
        };

        // Gestion spécifique pour l'appel d'un ticket (Synthèse vocale)
        if (event === 'ticket_called' || event === 'ticket_recalled') {
            try {
                const audioSettings = await SystemSetting.findAll({
                    where: { scope: 'SITE', scopeId: ticket.siteId, category: 'AUDIO' }
                });

                const settings = audioSettings.reduce((acc, s) => {
                    acc[s.key] = s.type === 'BOOLEAN' ? s.value === 'true' :
                        s.type === 'INTEGER' ? parseInt(s.value) : s.value;
                    return acc;
                }, {});

                if (settings.AUDIO_ENABLED) {
                    const ticketNumber = ticket.ticketNumber || '';
                    const parts = ticketNumber.split('-');
                    
                    // On essaie de récupérer le code du site pour le retirer du préfixe
                    // On suppose que le site est chargé (ou on le cherche si besoin)
                    const { Site } = require('../models/index.js');
                    const site = await Site.findByPk(ticket.siteId);
                    
                    const catPart = parts[0]?.replace(site?.code || '', '') || 'TICKET';
                    const numPart = (parts[1] || '0000').split('').join(' '); // Espacer les chiffres pour une meilleure dictée
                    
                    const destination = ticket.currentStep?.queue?.name || 'ZONE DE CONTRÔLE';
                    const isRecall = event === 'ticket_recalled';
                    const intro = isRecall ? 'Rappel.' : 'Appel.';

                    payload.audio = {
                        enabled: true,
                        text: `${intro} Le Ticket ${catPart} ${numPart} est appelé au ${destination}.`,
                        lang: settings.AUDIO_LANG || 'fr',
                        repetitions: settings.AUDIO_REPETITIONS || 2
                    };
                    payload.isRecall = isRecall;
                }
            } catch (err) {
                logger.error('Error fetching audio settings for socket event:', err);
            }
        }

        // Notification globale au site
        io.to(siteRoom).emit(event, payload);
        // Notification spécifique à la file d'attente
        const qId = ticket.currentStep?.queueId;
        if (qId) {
            io.to(`queue_${qId}`).emit(event, payload);
            await this.emitQueueUpdate(app, ticket.siteId, qId);
        }
    }

    /**
     * Met à jour le compteur de camions dans une file d'attente
     */
    async emitQueueUpdate(app, siteId, queueId) {
        const io = app.get('io');
        if (!io || !queueId) return;

        try {
            const count = await Ticket.count({
                where: {
                    siteId,
                    status: { [Op.in]: ['EN_ATTENTE', 'APPELE', 'EN_TRAITEMENT'] },
                    '$currentStep.queueId$': queueId
                },
                include: [{ model: WorkflowStep, as: 'currentStep' }]
            });

            io.to(`site_${siteId}`).emit('queue_updated', {
                queueId,
                siteId,
                truckCount: count,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Error emitting queue update:', error);
        }
    }
}

export default new NotificationService();
