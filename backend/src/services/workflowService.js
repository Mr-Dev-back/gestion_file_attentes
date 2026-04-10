import { Ticket, WorkflowStep, TicketActionLog, Workflow, TicketStep, AuditLog, Category, Queue } from '../models/index.js';

class WorkflowService {
  /**
   * Calcule le netWeight si weightIn et weightOut sont présents
   */
  calculateNetWeight(ticket) {
    if (ticket.weightIn && ticket.weightOut) {
      return Math.abs(parseFloat(ticket.weightOut) - parseFloat(ticket.weightIn));
    }
    return null;
  }

  /**
   * Initialise la première étape d'un ticket
   */
  async startFirstStep(ticketId, workflowId, transaction) {
    const firstStep = await WorkflowStep.findOne({
      where: { workflowId, orderNumber: 1 },
      transaction
    });

    if (!firstStep) throw new Error('Étape initiale (orderNumber=1) non trouvée');

    await TicketStep.create({
      ticketId,
      stepId: firstStep.stepId,
      startedAt: new Date(),
      isIsolated: false
    }, { transaction });

    return firstStep;
  }

  /**
   * Logique principale pour déplacer un ticket vers l'étape suivante (Séquentiel par orderNumber)
   */
  async moveToNextStep(ticketId, actorId, transaction) {
    const ticket = await Ticket.findByPk(ticketId, {
      include: [
        { 
          model: WorkflowStep, 
          as: 'currentStep',
          include: [{ model: Workflow, as: 'workflow' }]
        }
      ],
      transaction
    });

    if (!ticket) throw new Error('Ticket non trouvé');

    let workflowId = ticket.currentStep?.workflowId;
    if (!workflowId) {
      throw new Error('Le ticket n\'est associé à aucun workflow');
    }

    const currentOrder = ticket.currentStep?.orderNumber || 0;
    const nextOrder = currentOrder + 1;

    // Terminer l'étape actuelle dans TicketStep
    await TicketStep.update(
      { completedAt: new Date() },
      { 
        where: { 
          ticketId, 
          stepId: ticket.currentStepId,
          completedAt: null
        },
        transaction 
      }
    );

    // Trouver l'étape suivante : orderNumber exact
    const nextStep = await WorkflowStep.findOne({
      where: {
        workflowId,
        orderNumber: nextOrder
      },
      transaction
    });

    const oldStepId = ticket.currentStepId;

    if (nextStep) {
      // Récupérer les files d'attente de l'étape suivante pour assigner automatiquement
      const nextStepWithQueues = await WorkflowStep.findByPk(nextStep.stepId, {
        include: [{ model: Queue, as: 'queues' }],
        transaction
      });

      let nextQueueId = null;
      const nextQueues = nextStepWithQueues?.queues || [];
      
      if (nextQueues.length > 0) {
        // Si l'étape suivante n'a qu'une seule file, on l'assigne directement
        if (nextQueues.length === 1) {
          nextQueueId = nextQueues[0].queueId;
        } else {
          // Si plusieurs files, on essaie de matcher par catégorie du ticket
          const ticketWithCategory = await Ticket.findByPk(ticketId, {
            include: [{ 
              model: Category, 
              as: 'category',
              include: [{ model: Queue, as: 'queues' }]
            }],
            transaction
          });
          
          const catQueues = ticketWithCategory?.category?.queues || [];
          const matchedQueue = nextQueues.find(nq => catQueues.some(cq => cq.queueId === nq.queueId));
          nextQueueId = matchedQueue ? matchedQueue.queueId : nextQueues[0].queueId;
        }
      }

      await ticket.update({
        currentStepId: nextStep.stepId,
        status: 'EN_ATTENTE',
        calledBy: null,
        calledAt: null,
        startedAt: null,
        quaiId: null,
        queueId: nextQueueId
      }, { transaction });

      // Créer la nouvelle étape dans TicketStep
      await TicketStep.create({
        ticketId,
        stepId: nextStep.stepId,
        startedAt: new Date(),
        isIsolated: false
      }, { transaction });

      await TicketActionLog.create({
        ticketId: ticket.ticketId,
        stepId: nextStep.stepId,
        actionType: 'TERMINER',
        agentId: actorId,
        occurredAt: new Date()
      }, { transaction });

      return { moved: true, nextStep, nextQueueId };
    } else {
      // Pas d'étape suivante -> Fin du workflow
      await ticket.update({
        status: 'COMPLETE',
        completedAt: new Date(),
        quaiId: null
      }, { transaction });

      await TicketActionLog.create({
        ticketId: ticket.ticketId,
        stepId: oldStepId,
        actionType: 'TERMINER',
        agentId: actorId,
        occurredAt: new Date()
      }, { transaction });

      return { moved: false, completed: true };
    }
  }

  /**
   * Bascule manuellement l'isolation d'un ticket
   */
  async toggleIsolation(ticketId, actorId, transaction) {
    const ticket = await Ticket.findByPk(ticketId, { transaction });
    if (!ticket) throw new Error('Ticket non trouvé');

    const currentTicketStep = await TicketStep.findOne({
      where: { 
        ticketId, 
        stepId: ticket.currentStepId,
        completedAt: null
      },
      transaction
    });

    if (!currentTicketStep) throw new Error('Étape de ticket active non trouvée');

    const newIsIsolated = !currentTicketStep.isIsolated;
    const now = new Date();

    await currentTicketStep.update({
      isIsolated: newIsIsolated,
      // Si on isole, on pourrait vouloir marquer une pause dans le chrono?
      // Le prompt dit "arrêter le chrono en cours". 
      // Si isIsolated est vrai, le chrono s'arrête. On peut utiliser completedAt pour marquer l'arrêt,
      // mais si on reprend (un-isolate), on en recrée un?
      // Ou on ajoute une colonne 'pausedAt' / 'resumedAt'?
      // Simplification : on utilise isIsolated et le front gère l'affichage.
    }, { transaction });

    // Mettre à jour le statut du ticket également pour visibilité globale
    await ticket.update({
      status: newIsIsolated ? 'ISOLE' : 'CALLING' 
    }, { transaction });

    await AuditLog.create({
      userId: actorId,
      action: newIsIsolated ? 'ISOLATE_TICKET' : 'UNISOLATE_TICKET',
      entityName: 'Ticket',
      entityId: ticketId,
      details: { ticketNumber: ticket.ticketNumber, stepId: ticket.currentStepId },
      occurredAt: now
    }, { transaction });

    return { ticket, isIsolated: newIsIsolated };
  }

  /**
   * Gère le rappel d'un ticket et l'isolation automatique
   */
  async handleRecall(ticketId, actorId, transaction) {
    const ticket = await Ticket.findByPk(ticketId, {
      include: [{ model: WorkflowStep, as: 'currentStep' }],
      transaction
    });

    if (!ticket) throw new Error('Ticket non trouvé');

    const newRecallCount = (ticket.recallCount || 0) + 1;
    const isolationLimit = ticket.currentStep?.isolationAfterRecalls || 2;

    let newStatus = 'CALLING';
    let isolatedInStep = false;
    if (newRecallCount >= isolationLimit) {
      newStatus = 'ISOLE';
      isolatedInStep = true;
    }

    await ticket.update({
      recallCount: newRecallCount,
      status: newStatus
    }, { transaction });

    if (isolatedInStep) {
      await TicketStep.update(
        { isIsolated: true },
        { 
          where: { 
            ticketId, 
            stepId: ticket.currentStepId,
            completedAt: null
          },
          transaction 
        }
      );
    }

    await TicketActionLog.create({
      ticketId: ticket.ticketId,
      stepId: ticket.currentStepId,
      actionType: newStatus === 'ISOLE' ? 'ISOLER' : 'RAPPEL',
      agentId: actorId,
      occurredAt: new Date()
    }, { transaction });

    return ticket;
  }
}

export default new WorkflowService();
