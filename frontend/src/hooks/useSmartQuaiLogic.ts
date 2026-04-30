import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subject } from '@casl/ability';
import { useAbility } from '../auth/AbilityContext';
import { useAuthStore } from '../stores/useAuthStore';
import { useTicketWorkflow } from './useTicketWorkflow';
import { useSocketEvent } from './useSocketEvent';
import { api } from '../services/api';
import { ticketApi } from '../services/ticketApi';
import { toast } from '../components/molecules/ui/toast';
import type { Ticket, FormFieldConfig } from '../types/ticket';

export interface QuaiConfig {
  label: string;
  expectedStepCode?: string;
  categoryId?: string | null;
  formConfig: FormFieldConfig[];
}

export function useSmartQuaiLogic(quaiIdParam?: string) {
  const authStore = useAuthStore();
  const ability = useAbility();
  const quaiId = quaiIdParam || authStore.activeQuaiId || undefined;

  const [config, setConfig] = useState<QuaiConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<{ message: string; code?: number } | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tick, setTick] = useState(0); 
  const [pendingCallTicketId, setPendingCallTicketId] = useState<string | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const {
    tickets = [],
    isLoading: isLoadingTickets,
    callTicket,
    recallTicket,
    processTicket,
    completeStep,
    isCalling,
    isRecalling,
    isProcessing,
    isCompleting,
    isolateTicket,
    isIsolating,
  } = useTicketWorkflow(quaiId);

  // Tickets en attente
  const waitingTickets = useMemo(() =>
    tickets
      .filter(t => {
        const ticketWithTypename = { ...t, __typename: 'Ticket' };
        if (!ability.can('manage', subject('Ticket', ticketWithTypename))) return false;

        if (config?.expectedStepCode && t.currentStep?.stepCode) {
           const allowedCodes = config.expectedStepCode.split(',').map(s => s.trim());
           if (!allowedCodes.includes(t.currentStep.stepCode)) return false;
        }

        if (t.status === 'EN_ATTENTE') return true;
        if (t.status === 'ISOLE') return true;
        if (t.status === 'CALLING' && t.quaiId === quaiId) return true;

        return false;
      })
      .sort((a, b) => {
        if (b.priority !== a.priority) return (b.priority || 0) - (a.priority || 0);
        return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime();
      }),
    [tickets, quaiId, config?.expectedStepCode, ability]
  );

  // Ticket en cours de traitement
  const activeTicket = useMemo(() =>
    tickets.find(t => {
      if (t.status !== 'PROCESSING' || t.quaiId !== quaiId) return false;
      const ticketWithTypename = { ...t, __typename: 'Ticket' };
      if (!ability.can('manage', subject('Ticket', ticketWithTypename))) return false;
      if (!config?.expectedStepCode) return true;
      const allowedCodes = config.expectedStepCode.split(',').map(s => s.trim());
      return t.currentStep?.stepCode && allowedCodes.includes(t.currentStep.stepCode);
    }),
    [tickets, quaiId, config?.expectedStepCode, ability]
  );

  // Ticket appelé
  const callingTicket = useMemo(() =>
    tickets.find(t => {
      if (t.status !== 'CALLING' || t.quaiId !== quaiId) return false;
      const ticketWithTypename = { ...t, __typename: 'Ticket' };
      if (!ability.can('manage', subject('Ticket', ticketWithTypename))) return false;
      if (!config?.expectedStepCode) return true;
      const allowedCodes = config.expectedStepCode.split(',').map(s => s.trim());
      return t.currentStep?.stepCode && allowedCodes.includes(t.currentStep.stepCode);
    }),
    [tickets, quaiId, config?.expectedStepCode, ability]
  );

  // Sync selectedTicket avec les MAJ temps-réel
  useEffect(() => {
    if (!selectedTicket) return;
    const liveTicket = tickets.find(t => t.ticketId === selectedTicket.ticketId);
    
    if (!liveTicket) {
      setSelectedTicket(null);
      return;
    }

    const isStillSelectable =
      liveTicket.status === 'EN_ATTENTE' ||
      liveTicket.status === 'ISOLE' ||
      (liveTicket.status === 'CALLING' && liveTicket.quaiId === quaiId);

    if (!isStillSelectable) {
      setSelectedTicket(null);
      toast.info("Le véhicule sélectionné a été pris en charge par un autre poste.");
      return;
    }

    if (JSON.stringify(liveTicket) !== JSON.stringify(selectedTicket)) {
      setSelectedTicket(liveTicket);
    }
  }, [tickets, selectedTicket, quaiId]);

  // Fetch historique
  const { data: historyTickets = [], refetch: refetchHistory } = useQuery({
    queryKey: ['quaiHistory', quaiId],
    queryFn: () => ticketApi.getQuaiHistory(quaiId!),
    enabled: !!quaiId,
    initialData: []
  });

  // Config poste
  const fetchQuaiConfig = useCallback(async () => {
    if (!quaiId) return;
    try {
      setIsLoadingConfig(true);
      setConfigError(null);
      const response = await api.get<QuaiConfig>(`/quais/config/${quaiId}`);
      setConfig(response.data);
      document.title = `${response.data.label} | SIBM Terminal`;
    } catch (err: any) {
      setConfigError({ message: "Échec du chargement de la configuration du poste.", code: err.response?.status });
      toast.error("Échec du chargement de la configuration du poste.");
    } finally {
      setIsLoadingConfig(false);
    }
  }, [quaiId]);

  useEffect(() => {
    if (!quaiId) {
      setIsLoadingConfig(false);
      setConfigError({ message: "Identifiant de quai manquant dans l'URL." });
      return;
    }
    fetchQuaiConfig();
    return () => { document.title = 'GesParc'; };
  }, [fetchQuaiConfig, quaiId]);

  // Chrono
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // WebSockets
  useSocketEvent('ticket_updated', (payload: any) => {
    if (['ticket_completed', 'ticket_cancelled', 'ticket_transferred'].includes(payload.event)) {
      refetchHistory();
    }
  });

  // Call actions
  const handleCallNext = () => {
    const nextTicket = waitingTickets.find(t => t.status === 'EN_ATTENTE');
    if (nextTicket) {
      handleCallTicket(nextTicket.ticketId);
    } else {
      toast.info("Aucun véhicule en attente d'appel.");
    }
  };

  const handleCallTicket = useCallback((ticketId: string) => {
    if (callingTicket && callingTicket.ticketId !== ticketId) {
      setPendingCallTicketId(ticketId);
      return;
    }
    callTicket({ ticketId, quaiId });
  }, [callingTicket, callTicket, quaiId]);

  const handleConfirmOverrideCall = () => {
    if (pendingCallTicketId) callTicket({ ticketId: pendingCallTicketId, quaiId });
    setPendingCallTicketId(null);
  };

  const handleCancelOverrideCall = () => {
    setPendingCallTicketId(null);
  };

  const handleProcessTicket = (ticketId: string) => {
    processTicket(
      { ticketId, quaiId },
      { onError: () => toast.error("Impossible de démarrer le traitement. Veuillez réessayer.") }
    );
    setSelectedTicket(null);
  };

  const centralView = activeTicket ? 'processing'
    : callingTicket ? 'calling'
      : selectedTicket ? 'preview'
        : 'empty';

  return {
    quaiId,
    config,
    isLoadingConfig,
    configError,
    fetchQuaiConfig,
    selectedTicket,
    setSelectedTicket,
    pendingCallTicketId,
    setPendingCallTicketId,
    isTransferModalOpen,
    setIsTransferModalOpen,
    waitingTickets,
    activeTicket,
    callingTicket,
    historyTickets,
    refetchHistory,
    centralView,
    authStore,
    workflow: {
      isLoadingTickets,
      isCalling,
      isRecalling,
      isProcessing,
      isCompleting,
      isIsolating,
      callTicket,
      recallTicket,
      processTicket,
      completeStep,
      isolateTicket
    },
    actions: {
      handleCallNext,
      handleCallTicket,
      handleConfirmOverrideCall,
      handleCancelOverrideCall,
      handleProcessTicket,
    }
  };
}
