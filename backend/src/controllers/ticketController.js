import { Ticket, Queue, WorkflowStep, Category, User, TicketActionLog, TicketVehicleInfo, TicketLogistic, TicketStep, StepParameter } from '../models/index.js';
import auditService from '../services/auditService.js';
import Site from '../models/Site.js';
import QuaiParameter from '../models/QuaiParameter.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';
import { sequelize } from '../config/database.js';
import workflowService from '../services/workflowService.js';
import sageService from '../services/sageService.js';
import notificationService from '../services/notificationService.js';
import axios from 'axios';

class TicketController {

    createTicket = async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            let { siteId, categoryId, priority, driverName, driverPhone, licensePlate, orderNumber, companyName } = req.body;

            if (!siteId) {
                const firstSite = await Site.findOne({ transaction });
                if (!firstSite) throw new Error('No site found');
                siteId = firstSite.siteId;
            }

            const site = await Site.findByPk(siteId, { include: ['workflow'], transaction });
            if (!site || !site.workflowId) throw new Error('Site has no workflow');

            const initialStep = await WorkflowStep.findOne({
                where: { workflowId: site.workflowId, orderNumber: 1 },
                transaction
            });

            if (!initialStep) throw new Error('No initial step (orderNumber=1) found for this workflow');

            // Valider que la catégorie existe (évite les erreurs de clé étrangère avec des données front-end obsolètes)
            if (categoryId) {
                const category = await Category.findByPk(categoryId, { transaction });
                if (!category) {
                    logger.warn(`Invalid categoryId ${categoryId} provided, setting to null`);
                    categoryId = null;
                } else if (!category.isActive) {
                    await transaction.rollback();
                    return res.status(400).json({ error: 'La catégorie sélectionnée est inactive.' });
                }
            }

            const now = new Date();
            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);

            const siteCode = site.code || 'GP';
            const categoryObj = await Category.findByPk(categoryId, { transaction });
            const catCode = categoryObj?.code || categoryObj?.prefix || 'GEN';
            const ticketPrefix = `${siteCode}${catCode}-`;

            // Verrouiller les tickets pour éviter les doublons de numéro
            // On cherche le dernier ticket créé pour ce site et ce préfixe, toutes dates confondues
            const lastTicket = await Ticket.findOne({
                where: {
                    siteId,
                    ticketNumber: { [Op.like]: `${ticketPrefix}%` }
                },
                order: [['ticketNumber', 'DESC']],
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            let nextNumber = 1;
            if (lastTicket && lastTicket.ticketNumber) {
                const parts = lastTicket.ticketNumber.split('-');
                if (parts.length >= 2) {
                    const lastPart = parts[parts.length - 1];
                    nextNumber = parseInt(lastPart) + 1;
                }
            }

            const ticketNumber = `${ticketPrefix}${nextNumber.toString().padStart(4, '0')}`;

            // Déterminer la file d'attente initiale
            // Priorité 1: Une file associée à la fois à l'étape initiale ET à la catégorie du ticket
            // Priorité 2: La première file associée à l'étape initiale
            let initialQueueId = null;
            const stepQueues = await initialStep.getQueues({ transaction });
            
            if (stepQueues && stepQueues.length > 0) {
                if (categoryId) {
                    // Use getQueuesList for the One-to-Many relation defined by categoryId on Queue model
                    const catQueues = await categoryObj.getQueuesList({ transaction });
                    
                    // On cherche une file qui appartient à la fois à l'étape ET à la catégorie
                    const commonQueue = stepQueues.find(sq => catQueues.some(cq => cq.queueId === sq.queueId));
                    
                    if (commonQueue) {
                        initialQueueId = commonQueue.queueId;
                    } else {
                        // Si pas de file commune, on prend la première file de l'étape
                        initialQueueId = stepQueues[0].queueId;
                    }
                } else {
                    initialQueueId = stepQueues[0].queueId;
                }
            }

            const ticket = await Ticket.create({
                ticketNumber,
                siteId,
                categoryId,
                currentStepId: initialStep.stepId,
                queueId: initialQueueId,
                status: 'EN_ATTENTE',
                priority: priority || 0,
                driverName,
                driverPhone,
                licensePlate,
                orderNumber,
                companyName,
                arrivedAt: now
            }, { transaction });

            // Create initial TicketStep
            await TicketStep.create({
              ticketId: ticket.ticketId,
              stepId: initialStep.stepId,
              startedAt: now,
              isIsolated: false
            }, { transaction });

            // Créer les infos véhicule liées
            await TicketVehicleInfo.create({
                ticketId: ticket.ticketId,
                licensePlate: licensePlate || '---',
                driverName: driverName || 'Chauffeur inconnu',
                driverPhone: driverPhone || null,
                companyName: companyName || null
            }, { transaction });

            // Créer les infos logistique liées
            await TicketLogistic.create({
                ticketId: ticket.ticketId,
                orderNumber: orderNumber || null,
                plannedQuantity: 0 // Placeholder
            }, { transaction });

            // Log de l'action
            await TicketActionLog.create({
                ticketId: ticket.ticketId,
                stepId: initialStep.stepId,
                actionType: 'TERMINER', // Enregistrement initial considéré comme étape terminée
                agentId: req.user?.userId || null, // Borne si null
                formData: { note: 'Ticket généré à la borne' },
                occurredAt: new Date()
            }, { transaction });

            await transaction.commit();

            const fullTicket = await Ticket.findByPk(ticket.ticketId, {
                include: [
                    { model: Category, as: 'category' },
                    { model: TicketVehicleInfo, as: 'vehicleInfo' },
                    { model: TicketLogistic, as: 'logistic' },
                    { model: WorkflowStep, as: 'currentStep', include: ['queues'] }
                ]
            });

            res.status(201).json(fullTicket);
            
            // Émission des notifications Socket.io
            notificationService.emitTicketUpdate(req.app, fullTicket, 'ticket_created');
            
            // Notification spécifique pour les terminaux de quai
            const io = req.app.get('io');
            const targetQueueId = fullTicket.queueId || (fullTicket.currentStep?.queues?.[0]?.queueId);
            if (io && targetQueueId) {
                const queueRoom = `queue_${targetQueueId}`;
                io.to(queueRoom).emit('NEW_TICKET_IN_QUEUE', {
                    ticket: fullTicket,
                    timestamp: new Date()
                });
                logger.info(`Notification NEW_TICKET_IN_QUEUE envoyée à la file ${targetQueueId}`);
            }
        } catch (error) {
            await transaction.rollback();
            logger.error('Error creating ticket:', error);
            res.status(500).json({ error: 'Erreur lors de la création du ticket.' });
        }
    }

    /**
     * Valider un numéro de commande via Sage X3 (ou mock)
     */
    validateOrder = async (req, res) => {
        try {
            const { orderNumber } = req.params;
            const result = await sageService.validateOrder(orderNumber);
            res.json(result);
        } catch (error) {
            logger.error('Error validating order:', error);
            res.status(500).json({ error: 'Impossible de valider la commande Sage.' });
        }
    };

    /**
     * Enregistrer l'action d'impression dans les logs
     */
    logPrint = async (req, res) => {
        try {
            const { ticketId } = req.params;
            const ticket = await Ticket.findByPk(ticketId);
            
            if (!ticket) {
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            const logistic = await TicketLogistic.findByPk(ticketId);

            if (logistic) {
                await logistic.update({
                    printedCount: (logistic.printedCount || 0) + 1
                });
            }

            await TicketActionLog.create({
                ticketId,
                stepId: ticket.currentStepId,
                actionType: 'IMPRESSION',
                agentId: req.user?.userId || null,
                formData: { note: 'Ticket imprimé' },
                occurredAt: new Date()
            });

            res.json({
                success: true,
                printedCount: logistic ? logistic.printedCount : 0
            });
        } catch (error) {
            logger.error('Error logging print:', error);
            res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'impression.' });
        }
    };

    getTickets = async (req, res) => {
        try {
            const { siteId, status, queueId, quaiId, categoryId } = req.query;
            const where = {};
            
            // Si on est sur un quai, on ignore le siteId pour éviter les problèmes de comptes sans siteId
            if (siteId && !quaiId) where.siteId = siteId;
            if (categoryId) where.categoryId = categoryId;
            
            // Gestion du filtrage par statut (accepter tableau ou string)
            if (status) {
              if (Array.isArray(status)) {
                where.status = { [Op.in]: status };
              } else {
                where.status = status;
              }
            }

            let effectiveQueueId = queueId;
            let expectedStepCode = null;

            if (quaiId) {
                const quaiParam = await QuaiParameter.findByPk(quaiId, {
                    include: [{ 
                        model: WorkflowStep, 
                        as: 'step',
                        include: [{ model: Queue, as: 'queues' }] 
                    }, { model: Queue, as: 'queues' }]
                });

                if (quaiParam) {
                    // Support multiples step codes as comma-separated: "STP_2,STP_4"
                    expectedStepCode = quaiParam.expectedStepCode || (quaiParam.step ? quaiParam.step.stepCode : null);

                    // Collect all queues allowed for this quai (from self mapping or linked steps)
                    let quaiAllowedQueues = [];
                    if (quaiParam.queues && quaiParam.queues.length > 0) {
                        quaiAllowedQueues = quaiParam.queues.map(q => q.queueId);
                    } else if (quaiParam.queueId) {
                        quaiAllowedQueues = [quaiParam.queueId];
                    } else if (quaiParam.step) {
                         // If we have explicit multi-step code, we might need to find all queues of all those steps
                         if (expectedStepCode && expectedStepCode.includes(',')) {
                             const stepCodes = expectedStepCode.split(',').map(s => s.trim());
                             const steps = await WorkflowStep.findAll({
                                 where: { stepCode: { [Op.in]: stepCodes } },
                                 include: [{ model: Queue, as: 'queues' }]
                             });
                             steps.forEach(s => {
                                 const sq = s.queues?.map(q => q.queueId) || [];
                                 quaiAllowedQueues = [...new Set([...quaiAllowedQueues, ...sq])];
                             });
                         } else if (quaiParam.step.queues?.length > 0) {
                             quaiAllowedQueues = quaiParam.step.queues.map(q => q.queueId);
                         }
                    }

                    // Intel-Filtering logic:
                    // 1. If quai is global (categoryId IS NULL in QuaiParameter), show all tickets on this quai
                    // 2. If quai has a category, and user requested their specialty, check if specialty is handled here.
                    const requestedQueueId = queueId; 
                    if (!quaiParam.categoryId) {
                        effectiveQueueId = quaiAllowedQueues;
                    } else if (requestedQueueId) {
                        // Check if the requested queue is part of this quai's domain
                        if (quaiAllowedQueues.includes(requestedQueueId)) {
                            effectiveQueueId = requestedQueueId;
                        } else {
                            // Agent is at a quai that handles different queues, show all for this quai
                            effectiveQueueId = quaiAllowedQueues;
                        }
                    } else {
                        effectiveQueueId = quaiAllowedQueues;
                    }
                }
            }

            if (effectiveQueueId && (Array.isArray(effectiveQueueId) ? effectiveQueueId.length > 0 : true)) {
                if (Array.isArray(effectiveQueueId)) {
                    where.queueId = { [Op.in]: effectiveQueueId };
                } else {
                    where.queueId = effectiveQueueId;
                }
            }

            const tickets = await Ticket.findAll({
                where,
                include: [
                    { model: Category, as: 'category', required: false },
                    { model: TicketVehicleInfo, as: 'vehicleInfo', required: false },
                    { model: TicketLogistic, as: 'logistic', required: false },
                    { 
                        model: WorkflowStep, 
                        as: 'currentStep', 
                        // On filtre par l'étape attendue
                        where: {
                            ...(expectedStepCode ? { 
                                stepCode: expectedStepCode.includes(',') 
                                    ? { [Op.in]: expectedStepCode.split(',').map(s => s.trim()) } 
                                    : expectedStepCode 
                            } : {})
                        },
                        required: true, 
                        include: ['queues'] 
                    }
                ],
                order: [['priority', 'DESC'], ['arrivedAt', 'ASC']]
            });
            
            res.json(tickets);
        } catch (error) {
            logger.error('Error fetching tickets:', error);
            res.status(500).json({ error: 'Erreur récupération tickets.' });
        }
    }

    getTicketsByQueue = async (req, res) => {
        try {
            const { queueId } = req.params;
            const { status } = req.query;
            
            const where = { queueId };
            if (status) where.status = status;

            const include = [
                { model: Category, as: 'category' },
                { model: TicketVehicleInfo, as: 'vehicleInfo' },
                { model: TicketLogistic, as: 'logistic' },
                { 
                    model: WorkflowStep, 
                    as: 'currentStep', 
                    include: ['queues'] 
                }
            ];

            const tickets = await Ticket.findAll({
                where,
                include,
                order: [['priority', 'DESC'], ['arrivedAt', 'ASC']]
            });
            res.json(tickets);
        } catch (error) {
            logger.error('Error fetching tickets by queue:', error);
            res.status(500).json({ error: 'Erreur récupération tickets de la file.' });
        }
    }

    handleCall = async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const { ticketId } = req.params;
            const { quaiId } = req.body; // quaiId from body for PATCH
            const userId = req.user.userId;

            const ticket = await Ticket.findByPk(ticketId, { 
                lock: transaction.LOCK.UPDATE, 
                transaction 
            });

            if (!ticket) {
                await transaction.commit();
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            if (quaiId) {
                const activeOnQuai = await Ticket.findOne({
                    where: { 
                        quaiId, 
                        status: { [Op.in]: ['CALLING', 'PROCESSING'] },
                        ticketId: { [Op.ne]: ticketId }
                    },
                    transaction
                });

                if (activeOnQuai) {
                    await transaction.rollback();
                    return res.status(409).json({ error: 'Un autre ticket est déjà en cours d\'appel ou de traitement sur ce quai.' });
                }
            }

            await ticket.update({
                status: 'CALLING',
                calledBy: userId,
                calledAt: new Date(),
                quaiId: quaiId || ticket.quaiId,
                recallCount: ticket.status === 'ISOLE' ? 0 : ticket.recallCount
            }, { transaction });

            await auditService.logAction(req, 'TICKET_CALL', 'Ticket', ticketId, { status: 'EN_ATTENTE' }, { status: 'CALLING', quaiId });

            await transaction.commit();

            const fullTicket = await Ticket.findByPk(ticket.ticketId, {
                include: [
                    { model: Category, as: 'category' },
                    { model: TicketVehicleInfo, as: 'vehicleInfo' },
                    { model: TicketLogistic, as: 'logistic' },
                    { model: WorkflowStep, as: 'currentStep', include: ['queues'] }
                ]
            });

            // --- Intégration Appel Vocal (FastAPI) ---
            try {
                const quai = await QuaiParameter.findByPk(quaiId);
                const ticketNumber = fullTicket.ticketNumber || '';
                const parts = ticketNumber.split('-');
                const siteObj = await Site.findByPk(fullTicket.siteId);
                const catPart = parts[0]?.replace(siteObj?.code || '', '') || 'TICKET';
                const numPart = parts[1] || '0000';
                
                const quaiLabel = quai?.label || 'Quai';
                const announcementText = `Le Ticket ${catPart} ${numPart} est appelé au ${quaiLabel}`;
                
                logger.info(`Sending voice announcement: ${announcementText}`);
                
                const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8082';
                // On n'attend pas forcément la fin de l'annonce pour répondre au front, 
                // mais on attend au moins le retour de la requête HTTP pour confirmer l'envoi
                await axios.post(`${FASTAPI_URL}/announce`, {
                    text: announcementText,
                    lang: 'fr',
                    priority: 'high'
                }, { timeout: 3000 }); // Timeout court pour ne pas bloquer l'UI
                
            } catch (announceError) {
                logger.error('Erreur lors de l\'envoi de l\'annonce vocale:', announceError.message);
                // On continue quand même le workflow
            }
            // ------------------------------------------

            res.json(fullTicket);
            notificationService.emitTicketUpdate(req.app, fullTicket, 'ticket_called');
        } catch (error) {
            await transaction.rollback();
            logger.error('Error calling ticket:', error);
            res.status(500).json({ error: 'Erreur appel ticket.' });
        }
    }

    handleProcess = async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const { ticketId } = req.params;
            const { quaiId } = req.body; // or req.query depending on route matching, but using body is better for PATCH
            const userId = req.user.userId;

            const ticket = await Ticket.findByPk(ticketId, { 
                lock: transaction.LOCK.UPDATE, 
                transaction 
            });

            if (!ticket) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            if (ticket.status !== 'CALLING' && ticket.status !== 'EN_ATTENTE') {
                await transaction.rollback();
                return res.status(409).json({ error: 'Le ticket doit être appelé avant d\'être traité.' });
            }

            const updateData = {
                status: 'PROCESSING',
                calledBy: userId
            };

            if (!ticket.startedAt) {
                updateData.startedAt = new Date();
            }

            if (quaiId) {
                updateData.quaiId = quaiId;
            }

            await ticket.update(updateData, { transaction });

            await auditService.logAction(req, 'TICKET_START', 'Ticket', ticket.ticketId, { status: ticket.status }, { status: 'PROCESSING' });

            await transaction.commit();

            const fullTicket = await Ticket.findByPk(ticket.ticketId, {
                include: [
                    { model: Category, as: 'category' },
                    { model: TicketVehicleInfo, as: 'vehicleInfo' },
                    { model: TicketLogistic, as: 'logistic' },
                    { model: WorkflowStep, as: 'currentStep', include: ['queues'] }
                ]
            });

            let formConfig = [];
            const effectiveQuaiId = quaiId || fullTicket.quaiId;
            if (effectiveQuaiId) {
                const config = await QuaiParameter.findByPk(effectiveQuaiId);
                if (config) {
                    formConfig = config.formConfig;
                }
            }

            res.json({ ticket: fullTicket, formConfig });
            notificationService.emitTicketUpdate(req.app, fullTicket, 'ticket_started');
        } catch (error) {
            await transaction.rollback();
            logger.error('Error processing ticket:', error);
            res.status(500).json({ error: 'Erreur lors du traitement du ticket.' });
        }
    }

    handleRecall = async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const { ticketId } = req.params;
            const userId = req.user.userId;

            const ticket = await Ticket.findByPk(ticketId, { 
                lock: transaction.LOCK.UPDATE, 
                transaction 
            });

            if (!ticket) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            if (ticket.status !== 'CALLING') {
                await transaction.rollback();
                return res.status(409).json({ error: 'Le ticket doit être en cours d\'appel pour être rappelé.' });
            }

            // Incrémenter le compteur de rappels
            await ticket.update({
                recallCount: (ticket.recallCount || 0) + 1,
                updatedAt: new Date()
            }, { transaction });

            await TicketActionLog.create({
                ticketId,
                stepId: ticket.currentStepId,
                actionType: 'APPEL',
                agentId: userId,
                quaiId: ticket.quaiId,
                occurredAt: new Date(),
                formData: { note: 'Rappel du véhicule' }
            }, { transaction });

            await transaction.commit();

            const fullTicket = await Ticket.findByPk(ticket.ticketId, {
                include: [
                    { model: Category, as: 'category' },
                    { model: TicketVehicleInfo, as: 'vehicleInfo' },
                    { model: TicketLogistic, as: 'logistic' },
                    { model: WorkflowStep, as: 'currentStep', include: ['queues'] }
                ]
            });

            // --- Re-déclenchement Appel Vocal (FastAPI) ---
            try {
                const quai = await QuaiParameter.findByPk(fullTicket.quaiId);
                const ticketNumber = fullTicket.ticketNumber || '';
                const parts = ticketNumber.split('-');
                const siteObj = await Site.findByPk(fullTicket.siteId);
                const catPart = parts[0]?.replace(siteObj?.code || '', '') || 'TICKET';
                const numPart = parts[1] || '0000';

                const quaiLabel = quai?.label || 'Quai';
                const announcementText = `Rappel. Le Ticket ${catPart} ${numPart} est attendu au ${quaiLabel}`;
                
                logger.info(`Sending voice recall announcement: ${announcementText}`);
                
                const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8082';
                await axios.post(`${FASTAPI_URL}/announce`, {
                    text: announcementText,
                    lang: 'fr',
                    priority: 'high'
                }, { timeout: 3000 });
                
            } catch (announceError) {
                logger.error('Erreur lors du rappel vocal:', announceError.message);
            }
            // ------------------------------------------

            res.json(fullTicket);
            notificationService.emitTicketUpdate(req.app, fullTicket, 'ticket_called', { isRecall: true });
        } catch (error) {
            await transaction.rollback();
            logger.error('Error recalling ticket:', error);
            res.status(500).json({ error: 'Erreur lors du rappel du ticket.' });
        }
    }

    handleAssign = async (req, res) => {
        try {
            const { ticketId } = req.params;
            const { quaiId } = req.body;
            
            const ticket = await Ticket.findByPk(ticketId);
            if (!ticket) return res.status(404).json({ error: 'Ticket non trouvé.' });

            await ticket.update({ quaiId });
            
            const fullTicket = await Ticket.findByPk(ticketId, {
                include: [
                    { model: Category, as: 'category' },
                    { model: TicketVehicleInfo, as: 'vehicleInfo' },
                    { model: TicketLogistic, as: 'logistic' },
                    { model: WorkflowStep, as: 'currentStep', include: ['queues'] }
                ]
            });

            res.json(fullTicket);
            notificationService.emitTicketUpdate(req.app, fullTicket, 'ticket_assigned_quai');
        } catch(error) {
            logger.error('Error assigning ticket:', error);
            res.status(500).json({ error: 'Erreur assignation ticket.' });
        }
    }

    startTicket = async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const { ticketId } = req.params;
            const userId = req.user.userId;

            const ticket = await Ticket.findByPk(ticketId, { lock: transaction.LOCK.UPDATE, transaction });
            if (!ticket) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            await ticket.update({
                status: 'PROCESSING',
                startedAt: new Date()
            }, { transaction });

            await TicketActionLog.create({
                ticketId: ticket.ticketId,
                stepId: ticket.currentStepId,
                actionType: 'COMMENCER',
                agentId: userId,
                quaiId: ticket.quaiId, // Récupéré avant le commit
                occurredAt: new Date()
            }, { transaction });

            await transaction.commit();

            const fullTicket = await Ticket.findByPk(ticket.ticketId, {
                include: [
                    { model: Category, as: 'category' },
                    { model: TicketVehicleInfo, as: 'vehicleInfo' },
                    { model: TicketLogistic, as: 'logistic' },
                    { model: WorkflowStep, as: 'currentStep', include: ['queues'] }
                ]
            });

            res.json(fullTicket);
            notificationService.emitTicketUpdate(req.app, fullTicket, 'ticket_started');
        } catch (error) {
            await transaction.rollback();
            logger.error('Error starting ticket:', error);
            res.status(500).json({ error: 'Erreur démarrage ticket.' });
        }
    }

    /**
     * Terminer l'étape actuelle et passer à la suivante
     * Utilise formData (JSONB) pour enregistrer les données du formulaire dynamique
     */
    completeStep = async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const { ticketId } = req.params;
            const { formData, quaiId } = req.body;
            const userId = req.user.userId;

            const ticket = await Ticket.findByPk(ticketId, { transaction });
            if (!ticket) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            // Backend Validation: Data-Driven form verification
            if (quaiId && formData) {
                const config = await QuaiParameter.findByPk(quaiId, { transaction });
                if (config && config.formConfig) {
                    for (const field of config.formConfig) {
                        const value = formData[field.name];
                        
                        // Check if required field is missing or empty
                        if (field.required && (value === undefined || value === null || value === '')) {
                            await transaction.rollback();
                            return res.status(400).json({ error: `Validation échouée : Le champ '${field.label}' est obligatoire.` });
                        }

                        // Check types if a value is provided
                        if (value !== undefined && value !== null && value !== '') {
                            if (field.type === 'number') {
                                if (isNaN(Number(value))) {
                                    await transaction.rollback();
                                    return res.status(400).json({ error: `Validation échouée : Le champ '${field.label}' doit être un nombre valide.` });
                                }
                                // Format the number back if valid
                                formData[field.name] = Number(value); 
                            } else if (field.type === 'boolean') {
                                if (typeof value !== 'boolean' && value !== 'true' && value !== 'false' && value !== 0 && value !== 1) {
                                    await transaction.rollback();
                                    return res.status(400).json({ error: `Validation échouée : Le champ '${field.label}' doit être un booléen.` });
                                }
                                formData[field.name] = (value === 'true' || value === 1 || value === true);
                            }
                        }
                    }
                }
            }

            // Mise à jour des champs du ticket à partir de formData si présents (ex: poids)
            const ticketUpdates = {};
            if (formData) {
                if (formData.weightIn) ticketUpdates.weightIn = formData.weightIn;
                if (formData.weightOut) ticketUpdates.weightOut = formData.weightOut;
                
                // Calcul automatique du poids net si possible
                if (ticketUpdates.weightIn || ticketUpdates.weightOut || ticket.weightIn || ticket.weightOut) {
                    const tempTicket = { ...ticket.toJSON(), ...ticketUpdates };
                    const net = workflowService.calculateNetWeight(tempTicket);
                    formData.netWeight = net;
                }
            }

            if (Object.keys(ticketUpdates).length > 0) {
                await ticket.update(ticketUpdates, { transaction });
            }

            // Enregistrer l'action avec les données du formulaire
            await auditService.logAction(req, 'TICKET_FINISH', 'Ticket', ticket.ticketId, { status: ticket.status }, { status: 'COMPLETED', formData });

            // Passer à l'étape suivante
            const result = await workflowService.moveToNextStep(ticket.ticketId, userId, transaction);

            await transaction.commit();

            const updatedTicket = await Ticket.findByPk(ticketId, {
                include: [
                    { model: Category, as: 'category' },
                    { model: TicketVehicleInfo, as: 'vehicleInfo' },
                    { model: TicketLogistic, as: 'logistic' },
                    { model: WorkflowStep, as: 'currentStep', include: ['queues'] }
                ]
            });

            res.json({ ticket: updatedTicket, result });
            notificationService.emitTicketUpdate(req.app, updatedTicket, result.completed ? 'ticket_completed' : 'ticket_assigned');
        } catch (error) {
            await transaction.rollback();
            logger.error('Error completing step:', error);
            res.status(500).json({ error: 'Erreur lors de la validation de l\'étape.' });
        }
    }

    /**
     * Mettre à jour la priorité d'un ticket avec justification
     */
    updatePriority = async (req, res) => {
        try {
            const { ticketId } = req.params;
            const { priority, reason, priorityReason } = req.body;
            const userId = req.user.userId;

            const ticket = await Ticket.findByPk(ticketId);
            if (!ticket) {
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            // Mapping si la priorité arrive en texte
            let priorityValue = priority;
            if (typeof priority === 'string') {
                const map = { 'NORMAL': 0, 'URGENT': 1, 'CRITIQUE': 2 };
                priorityValue = map[priority.toUpperCase()] ?? 0;
            }

            const effectiveReason = reason || priorityReason || null;

            if (priorityValue === 2 && !effectiveReason) {
                return res.status(400).json({ error: 'Justification requise' });
            }

            await ticket.update({
                priority: priorityValue,
                priorityReason: effectiveReason
            });

            // Log de l'action
            await TicketActionLog.create({
                ticketId,
                stepId: ticket.currentStepId,
                actionType: 'PRIORITY_SET', // Type correspondant aux enums DB
                agentId: userId,
                formData: { priority: priorityValue, reason: effectiveReason },
                occurredAt: new Date()
            });

            const updatedTicket = await Ticket.findByPk(ticketId, {
                include: [
                    { model: Category, as: 'category' },
                    { model: TicketVehicleInfo, as: 'vehicleInfo' },
                    { model: TicketLogistic, as: 'logistic' },
                    { model: WorkflowStep, as: 'currentStep', include: ['queues'] }
                ]
            });

            res.json(updatedTicket);
            
            // Émet un événement spécifique pour l'overlay TV et un générique pour les listes
            notificationService.emitTicketUpdate(req.app, updatedTicket, 'ticket_priority_updated');
        } catch (error) {
            logger.error('Error updating priority:', error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour de la priorité.' });
        }
    }

    /**
     * Annuler un ticket
     */
    cancelTicket = async (req, res) => {
        try {
            const { ticketId } = req.params;
            const { reason } = req.body;
            const userId = req.user.userId;

            const ticket = await Ticket.findByPk(ticketId);
            if (!ticket) {
                return res.status(404).json({ error: 'Ticket non trouvé.' });
            }

            await ticket.update({
                status: 'ANNULE'
            });

            await TicketActionLog.create({
                ticketId,
                stepId: ticket.currentStepId,
                actionType: 'ANNULER',
                agentId: userId,
                formData: { reason },
                occurredAt: new Date()
            });

            res.json({ success: true, message: 'Ticket annulé avec succès.' });
            notificationService.emitTicketUpdate(req.app, ticket, 'ticket_cancelled');
        } catch (error) {
            logger.error('Error cancelling ticket:', error);
            res.status(500).json({ error: 'Erreur lors de l\'annulation du ticket.' });
        }
    }

    /**
     * Basculer l'isolation d'un ticket
     */
    isolateTicket = async (req, res) => {
      const transaction = await sequelize.transaction();
      try {
        const { ticketId } = req.params;
        const userId = req.user.userId;

        const result = await workflowService.toggleIsolation(ticketId, userId, transaction);
        await transaction.commit();

        const fullTicket = await Ticket.findByPk(ticketId, {
          include: [
            { model: Category, as: 'category' },
            { model: TicketVehicleInfo, as: 'vehicleInfo' },
            { model: TicketLogistic, as: 'logistic' },
            { model: WorkflowStep, as: 'currentStep', include: ['queues'] }
          ]
        });

        res.json({ ticket: fullTicket, isIsolated: result.isIsolated });
        notificationService.emitTicketUpdate(req.app, fullTicket, result.isIsolated ? 'ticket_isolated' : 'ticket_unisolated');
      } catch (error) {
        await transaction.rollback();
        logger.error('Error isolating ticket:', error);
        res.status(500).json({ error: error.message || 'Erreur isolation ticket.' });
      }
    }

    /**
     * Récupérer la configuration dynamique du formulaire
     */
    getStepConfig = async (req, res) => {
      try {
        const { ticketId } = req.params;
        const { quaiId } = req.query;

        const ticket = await Ticket.findByPk(ticketId);
        if (!ticket) return res.status(404).json({ error: 'Ticket non trouvé' });

        const stepParameter = await StepParameter.findOne({
          where: {
            stepId: ticket.currentStepId,
            quaiId
          }
        });

        if (!stepParameter) {
          return res.json({ formConfig: {} });
        }

        res.json({ formConfig: stepParameter.formConfig });
      } catch (error) {
        logger.error('Error fetching step config:', error);
        res.status(500).json({ error: 'Erreur configuration formulaire.' });
      }
    }

    getQuaiHistory = async (req, res) => {
      try {
        const { quaiId } = req.params;
        
        // Trouver les 5 derniers tickets uniques ayant eu une action TERMINER sur ce quai
        const logs = await TicketActionLog.findAll({
          where: {
            quaiId,
            actionType: 'TERMINER'
          },
          order: [['occurredAt', 'DESC']],
          attributes: ['ticketId'],
          limit: 20 // on prend un peu plus car il peut y avoir des doublons par ticket
        });

        const uniqueTicketIds = [...new Set(logs.map(l => l.ticketId))].slice(0, 5);

        if (uniqueTicketIds.length === 0) return res.json([]);

        const history = await Ticket.findAll({
          where: {
            ticketId: { [Op.in]: uniqueTicketIds }
          },
          include: [
            { model: Category, as: 'category' },
            { model: TicketVehicleInfo, as: 'vehicleInfo' }
          ],
          order: [['updatedAt', 'DESC']]
        });

        res.json(history);
      } catch (error) {
        logger.error('Error fetching quai history:', error);
        res.status(500).json({ error: 'Erreur historique.' });
      }
    }

    /**
     * Récupérer l'historique complet (ActionLogs) d'un ticket
     */
    getTicketFullHistory = async (req, res) => {
      try {
        const { ticketId } = req.params;

        const ticket = await Ticket.findByPk(ticketId, {
          include: [
            { model: Category, as: 'category' },
            { model: TicketVehicleInfo, as: 'vehicleInfo' }
          ]
        });

        if (!ticket) {
          return res.status(404).json({ error: 'Ticket non trouvé.' });
        }

        const logs = await TicketActionLog.findAll({
          where: { ticketId },
          include: [
            { 
              model: User, 
              as: 'agent', 
              attributes: ['username', 'firstName', 'lastName'] 
            },
            { 
              model: WorkflowStep, 
              as: 'step',
              include: [{ model: Queue, as: 'queues', attributes: ['name'] }]
            }
          ],
          order: [['occurredAt', 'DESC']]
        });

        res.json({
          ticket,
          history: logs
        });
      } catch (error) {
        logger.error('Error fetching full ticket history:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique.' });
      }
    }
    /**
     * Transférer un ticket vers un autre quai de la même étape
     */
    transferTicket = async (req, res) => {
      const transaction = await sequelize.transaction();
      try {
        const { ticketId } = req.params;
        const { targetQuaiId, targetCategoryId } = req.body;
        const userId = req.user.userId;

        const ticket = await Ticket.findByPk(ticketId, { 
            include: ['currentStep', 'category'],
            transaction 
        });
        
        if (!ticket) {
          await transaction.rollback();
          return res.status(404).json({ error: 'Ticket non trouvé.' });
        }

        let newQuaiId = ticket.quaiId;
        let newQueueId = ticket.queueId;
        const toLabels = [];

        // Traitement du changement de quai
        if (targetQuaiId && targetQuaiId !== ticket.quaiId) {
          const targetQuai = await QuaiParameter.findByPk(targetQuaiId, { transaction });
          if (!targetQuai) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Quai cible non trouvé.' });
          }
          if (targetQuai.stepId !== ticket.currentStepId) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Le quai cible ne correspond pas à l\'étape actuelle du ticket.' });
          }
          newQuaiId = targetQuaiId;
          newQueueId = targetQuai.queueId || ticket.queueId;
          toLabels.push(`Quai: ${targetQuai.label}`);
        }

        // Traitement du changement de catégorie
        if (targetCategoryId && targetCategoryId !== ticket.categoryId) {
          const targetCategory = await Category.findByPk(targetCategoryId, { 
            include: [{ model: Queue, as: 'queues' }],
            transaction 
          });
          if (!targetCategory) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Catégorie cible non trouvée.' });
          }
          
          // Si on change de catégorie, on doit aussi mettre à jour la file d'attente
          // en cherchant une file commune entre la nouvelle catégorie et l'étape actuelle
          const stepQueues = await ticket.currentStep.getQueues({ transaction });
          const commonQueue = stepQueues.find(sq => targetCategory.queues?.some(cq => cq.queueId === sq.queueId));
          
          if (commonQueue) {
            newQueueId = commonQueue.queueId;
          } else if (stepQueues.length > 0) {
            newQueueId = stepQueues[0].queueId;
          }
          
          toLabels.push(`Catégorie: ${targetCategory.name}`);
        }

        const oldQuaiId = ticket.quaiId;
        const oldQuai = await QuaiParameter.findByPk(oldQuaiId, { transaction });

        // Update Ticket
        await ticket.update({
          quaiId: newQuaiId,
          queueId: newQueueId,
          categoryId: targetCategoryId || ticket.categoryId,
          status: 'EN_ATTENTE',
          isTransferred: true,
          calledAt: null,
          startedAt: null,
          calledBy: null
        }, { transaction });

        // Log the transfer
        await TicketActionLog.create({
          ticketId,
          stepId: ticket.currentStepId,
          actionType: 'TRANSFERE',
          agentId: userId,
          quaiId: newQuaiId,
          formData: {
            fromQuaiId: oldQuaiId,
            fromQuaiLabel: oldQuai?.label || '---',
            fromCategoryName: ticket.category?.name || '---',
            toDecision: toLabels.join(' | ')
          },
          occurredAt: new Date()
        }, { transaction });

        await transaction.commit();

        const fullTicket = await Ticket.findByPk(ticketId, {
          include: [
            { model: Category, as: 'category' },
            { model: TicketVehicleInfo, as: 'vehicleInfo' },
            { model: TicketLogistic, as: 'logistic' },
            { model: WorkflowStep, as: 'currentStep', include: ['queues'] }
          ]
        });

        res.json({ success: true, ticket: fullTicket });
        
        // Notifications
        notificationService.emitTicketUpdate(req.app, fullTicket, 'ticket_transferred');
      } catch (error) {
        if (transaction) await transaction.rollback();
        logger.error('Error transferring ticket:', error);
        res.status(500).json({ error: 'Erreur lors du transfert du ticket.' });
      }
    }
    /**
     * Force le passage d'un ticket à une étape spécifique (Surcharge Superviseur)
     */
    jumpToStep = async (req, res) => {
      const transaction = await sequelize.transaction();
      try {
        const { ticketId } = req.params;
        const { stepId } = req.body;
        const userId = req.user.userId;

        const ticket = await Ticket.findByPk(ticketId, { transaction });
        if (!ticket) {
          await transaction.rollback();
          return res.status(404).json({ error: 'Ticket non trouvé.' });
        }

        const targetStep = await WorkflowStep.findByPk(stepId, { transaction });
        if (!targetStep) {
          await transaction.rollback();
          return res.status(404).json({ error: 'Étape cible non trouvée.' });
        }

        const oldStepId = ticket.currentStepId;

        // Mettre à jour le ticket
        await ticket.update({
          currentStepId: stepId,
          status: 'EN_ATTENTE', // On repasse en attente à la nouvelle étape
          quaiId: null, // On libère le quai actuel
          isTransferred: true // Marqueur pour affichage "Manuel"
        }, { transaction });

        // Log de l'action de saut
        await TicketActionLog.create({
          ticketId,
          stepId,
          actionType: 'TRANSFERE',
          agentId: userId,
          formData: { 
            note: 'Saut d\'étape forcé par le superviseur',
            fromStepId: oldStepId,
            toStepId: stepId
          },
          occurredAt: new Date()
        }, { transaction });

        await transaction.commit();

        const updatedTicket = await Ticket.findByPk(ticketId, {
          include: [
            { model: Category, as: 'category' },
            { model: TicketVehicleInfo, as: 'vehicleInfo' },
            { model: TicketLogistic, as: 'logistic' },
            { model: WorkflowStep, as: 'currentStep', include: ['queues'] }
          ]
        });

        res.json({ success: true, ticket: updatedTicket });
        notificationService.emitTicketUpdate(req.app, updatedTicket, 'ticket_transferred');
      } catch (error) {
        if (transaction) await transaction.rollback();
        logger.error('Error jumping step:', error);
        res.status(500).json({ error: 'Erreur lors du changement d\'étape.' });
      }
    }
}

export default new TicketController();
