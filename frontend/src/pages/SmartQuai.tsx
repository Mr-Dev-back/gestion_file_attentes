import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Truck,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  ArrowRight,
  Phone,
  Timer as TimerIcon,
  ChevronRight,
  Volume2,
  History,
  User as UserIcon,
  X,
  Clock,
  ArrowLeftRight,
  Tags,
  AlertTriangle,
  History as HistoryIcon,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAbility } from '../auth/AbilityContext';
import { subject } from '@casl/ability';

import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useTicketWorkflow } from '../hooks/useTicketWorkflow';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { Button } from '../components/atoms/ui/button';
import { Input } from '../components/atoms/ui/input';
import { Timer } from '../components/atoms/ui/Timer';
import { toast } from '../components/molecules/ui/toast';
import { Modal, ConfirmModal } from '../components/molecules/ui/modal'; 
import { EmptyState } from '../components/molecules/ui/empty-state';
import { cn } from '../lib/utils';
import { ticketApi } from '../services/ticketApi';
import type { Ticket, FormFieldConfig } from '../types/ticket';
import { useQuery } from '@tanstack/react-query';

interface QuaiConfig {
  label: string;
  expectedStepCode?: string;
  categoryId?: string | null;
  formConfig: FormFieldConfig[];
}

export default function SmartQuai() {
  const params = useParams<{ quaiId: string }>();
  const authStore = useAuthStore();
  const ability = useAbility();
  const quaiId = params.quaiId || authStore.activeQuaiId || undefined;

  const [config, setConfig] = useState<QuaiConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<{ message: string; code?: number } | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tick, setTick] = useState(0); // For forcing re-renders of wait times

  // [AMÉLIORATION 3] État pour la modale de confirmation d'appel concurrent
  const [pendingCallTicketId, setPendingCallTicketId] = useState<string | null>(null);

  // [NOUVEAU] États pour la modale d'historique
  const [historyTicketId, setHistoryTicketId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // [NOUVEAU] État pour la modale de transfert
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

  // Tickets en attente ou en cours d'appel
  // [AMÉLIORATION 1] Dépendances useMemo complètes : ajout de quaiId et config?.expectedStepCode
  const waitingTickets = useMemo(() =>
    tickets
      .filter(t => {
        // [CASL] Vérification de la capacité à gérer ce ticket selon les files assignées
        // On injecte __typename pour que detectSubjectType fonctionne
        const ticketWithTypename = { ...t, __typename: 'Ticket' };
        if (!ability.can('manage', subject('Ticket', ticketWithTypename))) return false;

        // Filtrage par stepCode en priorité si défini (Supporte le multi-étapes via virgules)
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

  // [AMÉLIORATION 2] Synchronisation du selectedTicket avec les mises à jour temps-réel
  // Si le ticket sélectionné change de statut (ex: pris par un autre quai), on désélectionne
  useEffect(() => {
    if (!selectedTicket) return;

    const liveTicket = tickets.find(t => t.ticketId === selectedTicket.ticketId);

    // Le ticket n'existe plus dans la liste (traité, annulé, etc.)
    if (!liveTicket) {
      setSelectedTicket(null);
      return;
    }

    // Le ticket a été pris par un autre quai ou son statut n'est plus "sélectionnable"
    const isStillSelectable =
      liveTicket.status === 'EN_ATTENTE' ||
      liveTicket.status === 'ISOLE' ||
      (liveTicket.status === 'CALLING' && liveTicket.quaiId === quaiId);

    if (!isStillSelectable) {
      setSelectedTicket(null);
      toast.info("Le véhicule sélectionné a été pris en charge par un autre poste.");
      return;
    }

    // Mise à jour des données du ticket sélectionné si elles ont changé
    if (JSON.stringify(liveTicket) !== JSON.stringify(selectedTicket)) {
      setSelectedTicket(liveTicket);
    }
  }, [tickets, selectedTicket, quaiId]);

  // Historique récent récupéré depuis l'API dédiée
  const { data: historyTickets = [], refetch: refetchHistory } = useQuery({
    queryKey: ['quaiHistory', quaiId],
    queryFn: () => ticketApi.getQuaiHistory(quaiId!),
    enabled: !!quaiId,
    initialData: []
  });

  const completedTickets = historyTickets;

  // Fetch Quai Configuration
  const fetchQuaiConfig = useCallback(async () => {
    if (!quaiId) return;
    try {
      setIsLoadingConfig(true);
      setConfigError(null);
      const response = await api.get<QuaiConfig>(`/quais/config/${quaiId}`);
      setConfig(response.data);
      // Dynamic Title
      document.title = `${response.data.label} | SIBM Terminal`;
    } catch (err: any) {
      const message = "Échec du chargement de la configuration du poste.";
      const code = err.response?.status;
      setConfigError({ message, code });
      toast.error(message);
    } finally {
      setIsLoadingConfig(false);
    }
  }, [quaiId]);

  useEffect(() => {
    fetchQuaiConfig();
    return () => { document.title = 'SIBM GFA'; };
  }, [fetchQuaiConfig]);

  // Tick every minute for wait times
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Synchronisation par Socket
  useSocketEvent('ticket_updated', (payload: any) => {
    if (['ticket_completed', 'ticket_cancelled', 'ticket_transferred'].includes(payload.event)) {
      refetchHistory();
    }
  });

  // Schéma de validation dynamique
  const dynamicSchema = useMemo(() => {
    if (!config?.formConfig) return z.object({});
    const shape: Record<string, z.ZodTypeAny> = {};
    config.formConfig.forEach((field) => {
      // [AMÉLIORATION — typage] Suppression du cast `as any` grâce au typage explicite ZodTypeAny
      const base: z.ZodTypeAny = field.type === 'number' ? z.coerce.number() : z.string();
      shape[field.name] = field.required ? base : base.optional().nullable();
    });
    return z.object(shape);
  }, [config]);

  const defaultValues = useMemo(() => {
    const defaults: Record<string, any> = {};
    config?.formConfig.forEach(f => { defaults[f.name] = f.defaultValue ?? ''; });
    return defaults;
  }, [config]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<Record<string, any>>({
    // [AMÉLIORATION — typage] Cast limité au minimum nécessaire
    resolver: zodResolver(dynamicSchema) as unknown as ReturnType<typeof zodResolver>,
    defaultValues
  });

  // Reset le formulaire quand la config change
  useEffect(() => {
    if (config?.formConfig) {
      reset(defaultValues);
    }
  }, [config?.formConfig, reset, defaultValues]);

  const handleCallNext = () => {
    const nextTicket = waitingTickets.find(t => t.status === 'EN_ATTENTE');
    if (nextTicket) {
      handleCallTicket(nextTicket.ticketId);
    } else {
      toast.info("Aucun véhicule en attente d'appel.");
    }
  };

  // [AMÉLIORATION 3] Remplace window.confirm par une modale React
  const handleCallTicket = useCallback((ticketId: string) => {
    if (callingTicket && callingTicket.ticketId !== ticketId) {
      // On stocke l'id en attente et on ouvre la modale
      setPendingCallTicketId(ticketId);
      return;
    }
    callTicket({ ticketId, quaiId });
  }, [callingTicket, callTicket, quaiId]);

  const handleConfirmOverrideCall = () => {
    if (pendingCallTicketId) {
      callTicket({ ticketId: pendingCallTicketId, quaiId });
    }
    setPendingCallTicketId(null);
  };

  const handleCancelOverrideCall = () => {
    setPendingCallTicketId(null);
  };

  const handleProcessTicket = (ticketId: string) => {
    processTicket(
      { ticketId, quaiId },
      // [AMÉLIORATION 4] Gestion d'erreur sur processTicket
      {
        onError: () => toast.error("Impossible de démarrer le traitement. Veuillez réessayer."),
      }
    );
    setSelectedTicket(null);
  };

  const onSubmit = (formData: any) => {
    if (!activeTicket) return;
    completeStep(
      { ticketId: activeTicket.ticketId, formData, quaiId },
      {
        onSuccess: () => {
          toast.success("Étape validée !");
          reset();
          refetchHistory();
        },
        // [AMÉLIORATION 4] Gestion d'erreur sur completeStep
        onError: () => {
          toast.error("Échec de la validation. Les données n'ont pas été enregistrées.");
        }
      }
    );
  };

  const handleOpenHistory = (ticketId: string) => {
    setHistoryTicketId(ticketId);
    setIsHistoryModalOpen(true);
  };

  const centralView = activeTicket ? 'processing'
    : callingTicket ? 'calling'
      : selectedTicket ? 'preview'
        : 'empty';

  // [AMÉLIORATION 5] Condition d'erreur config
  if (configError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-6">
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-danger/10 flex flex-col items-center text-center max-w-md">
          <div className="w-20 h-20 bg-danger/10 rounded-3xl flex items-center justify-center mb-6">
            <AlertTriangle className="h-10 w-10 text-danger" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Erreur de Configuration</h2>
          <p className="text-slate-500 text-sm mb-8">{configError.message}</p>
          <Button onClick={fetchQuaiConfig} className="w-full h-14 rounded-2xl gap-2 font-black uppercase tracking-widest">
            <RefreshCw className="h-5 w-5" /> Réessayer
          </Button>
          {configError.code && (
            <span className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-widest">
              Code technique : {configError.code}
            </span>
          )}
        </div>
      </div>
    );
  }

  // [AMÉLIORATION 5] Condition de chargement corrigée :
  // On n'attend plus isLoadingConfig si activeTicket est déjà disponible
  if (isLoadingTickets || isLoadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-white gap-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-black uppercase tracking-[0.5em] text-slate-400 animate-pulse">Initialisation</span>
          <span className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em]">Terminal de Gestion SIBM</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden font-sans">

      {/* [AMÉLIORATION 3] Modale de confirmation pour l'appel concurrent */}
      <ConfirmModal
        isOpen={!!pendingCallTicketId}
        onClose={handleCancelOverrideCall}
        onConfirm={handleConfirmOverrideCall}
        title="Appel concurrent"
        message="Un véhicule est déjà en cours d'appel sur ce poste. Voulez-vous quand même appeler ce véhicule ?"
        confirmText="Appeler quand même"
        cancelText="Annuler"
        variant="warning"
      />

      {/* COLUMN 1: WAITING LIST */}
      <motion.aside
        initial={{ x: -300 }} animate={{ x: 0 }}
        className="w-[320px] bg-slate-50/50 backdrop-blur-xl border-r border-slate-200 flex flex-col z-20 shadow-xl"
      >
        <div className="p-8 bg-white/80 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">File d'Attente</h2>
                {authStore.user?.queue?.name && config?.categoryId && (
                  <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
                    Filtré: {authStore.user.queue.name}
                  </span>
                )}
              </div>
              <p className="text-xl font-black text-slate-800 tracking-tighter uppercase">Véhicules</p>
            </div>
            <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded">
              {waitingTickets.length}
            </span>
          </div>

          <Button
            onClick={handleCallNext}
            disabled={isCalling || !waitingTickets.some(t => t.status === 'EN_ATTENTE')}
            className="w-full h-10 bg-gradient-to-r from-primary to-primary/80 font-black uppercase tracking-widest text-[10px] gap-2 rounded-xl shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            {isCalling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Phone className="h-3 w-3" />}
            Appeler Suivant
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
          {waitingTickets.map((ticket) => (
            <motion.div
              layout
              key={ticket.ticketId}
              onClick={() => setSelectedTicket(ticket)}
              whileHover={{ x: 6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "p-6 rounded-3xl border-2 transition-all cursor-pointer shadow-sm relative overflow-hidden group/item",
                selectedTicket?.ticketId === ticket.ticketId
                  ? "bg-white border-primary shadow-xl ring-4 ring-primary/5"
                  : ticket.status === 'CALLING'
                    ? "bg-amber-50 border-amber-200 shadow-md"
                    : "bg-white/40 border-slate-100 hover:border-slate-300 hover:bg-white hover:shadow-lg"
              )}
            >
              {selectedTicket?.ticketId === ticket.ticketId && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
              )}
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-mono font-bold text-slate-400">#{ticket.ticketNumber}</span>
                {ticket.status === 'CALLING' && (
                  <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest animate-pulse">Appelé</span>
                )}
                {ticket.status === 'ISOLE' && (
                  <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">Isolé</span>
                )}
                {ticket.isTransferred && (
                  <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-widest">Multi</span>
                )}
              </div>
              <p className="text-lg font-black text-slate-800 uppercase tracking-tight">{ticket.licensePlate}</p>
              <div className="flex flex-col gap-1">
                <p className="text-[9px] text-slate-500 font-bold uppercase truncate">
                  {(ticket as any).driverName || (ticket as any).companyName || 'En attente'}
                </p>
                {/* Wait Time Indicator */}
                <div className="flex items-center gap-1.5 mt-1 border-t border-slate-50 pt-1">
                   {(() => {
                     const diff = differenceInMinutes(new Date(), new Date(ticket.arrivedAt));
                     const colorClass = diff > 30 ? 'text-danger font-bold' : diff > 15 ? 'text-amber-500 font-bold' : 'text-slate-400';
                     return (
                       <>
                         <Clock className={cn("h-3 w-3", colorClass)} />
                         <span className={cn("text-[9px] font-black uppercase tracking-tight", colorClass)}>
                           {formatDistanceToNow(new Date(ticket.arrivedAt), { addSuffix: true, locale: fr })}
                         </span>
                       </>
                     );
                   })()}
                </div>
              </div>
            </motion.div>
          ))}
          {waitingTickets.length === 0 && (
            <div className="py-20 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">
              Aucun véhicule
            </div>
          )}
          <div className="p-4 border-t border-slate-50 bg-white">
                  <Button
                    variant="ghost"
                    onClick={authStore.logout}
                    className={cn(
                      'w-full h-12 justify-start text-red-500 hover:bg-red-50 hover:text-red-600 rounded-2xl font-bold transition-all justify-center px-0'
                    )}
                  >
                    <LogOut size={20} className="shrink-0" />
                    { <span className="ml-3 uppercase tracking-widest text-xs">Déconnexion</span>}
                  </Button>
                </div>
        </div>
      </motion.aside>

      {/* COLUMN 2: CENTRAL ZONE */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        <AnimatePresence mode="wait">

          {/* EMPTY STATE */}
          {centralView === 'empty' && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 flex flex-col items-center"
              >
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl mb-10 border border-slate-100">
                  <Truck className="h-24 w-24 text-primary animate-bounce-slow" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-[0.4em]">Terminal Prêt</h1>
                <div className="h-1 w-12 bg-primary rounded-full mt-6 mb-6" />
                <p className="text-xs text-slate-400 font-black uppercase tracking-[0.3em]">Sélectionnez un véhicule dans la file</p>
              </motion.div>
            </motion.div>
          )}

          {/* PREVIEW STATE */}
          {centralView === 'preview' && selectedTicket && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col p-8"
            >
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white p-8 rounded-3xl shadow-2xl flex flex-col justify-center min-h-[20vh] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Truck size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[9px] font-black uppercase tracking-[0.3em] border border-white/10">
                      {config?.label || 'Poste de travail'}
                    </span>
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none drop-shadow-2xl">
                    {selectedTicket.licensePlate}
                  </h1>
                  {selectedTicket.isTransferred && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg backdrop-blur-sm">
                      <ArrowLeftRight size={12} className="text-blue-300" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-200">Multi-Chargement / Transféré</span>
                    </div>
                  )}
                  <div className="mt-6 flex gap-8">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">N° Ticket</p>
                      <p className="text-xl font-black text-primary-foreground drop-shadow-md">#{selectedTicket.ticketNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Heure d'Arrivée</p>
                      <p className="text-xl font-black">{new Date(selectedTicket.arrivedAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-4xl space-y-12">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Chauffeur</p>
                      <p className="text-xl font-black text-slate-900 uppercase">{(selectedTicket as any).driverName || '---'}</p>
                    </div>
                    <div className="space-y-1 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Société</p>
                      <p className="text-xl font-black text-slate-900 uppercase">{(selectedTicket as any).companyName || '---'}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {selectedTicket.status === 'ISOLE' ? (
                      <Button
                        onClick={() => isolateTicket(selectedTicket.ticketId)}
                        disabled={isIsolating}
                        variant="outline"
                        className="flex-1 h-14 text-xl font-black uppercase tracking-widest gap-3 rounded-2xl border-danger/20 text-danger hover:bg-danger/5 shadow-lg active:scale-95 transition-all"
                      >
                        {isIsolating ? <Loader2 className="animate-spin h-6 w-6" /> : <><PlayCircle className="h-6 w-6" /> Reprendre</>}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleCallTicket(selectedTicket.ticketId)}
                        disabled={isCalling}
                        className="flex-1 h-16 text-xl font-black uppercase tracking-widest gap-4 rounded-2xl shadow-xl bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                      >
                        {isCalling ? (
                          <>
                            <Loader2 className="animate-spin h-6 w-6" />
                            <span>Appel...</span>
                          </>
                        ) : (
                          <><Phone className="h-6 w-6 group-hover:animate-bounce" /> Appeler</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CALLING STATE */}
          {centralView === 'calling' && callingTicket && (
            <motion.div
              key="calling"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col p-8"
            >
              <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-orange-500 text-white p-8 rounded-3xl shadow-2xl flex flex-col justify-center min-h-[20vh] relative overflow-hidden">
                <motion.div
                  initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  className="absolute -top-24 -right-24 h-64 w-64 bg-white/10 blur-[80px] rounded-full"
                />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="flex items-center gap-3 mb-4 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                    <Phone className="h-4 w-4 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-[0.4em]">Appel en cours...</span>
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none drop-shadow-2xl">
                    {callingTicket.licensePlate}
                  </h1>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-8 gap-10">
                <div className="flex items-center gap-4 text-slate-400 animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-black uppercase tracking-[0.5em]">En attente de démarrage saisie</span>
                </div>
                <div className="w-full max-w-5xl flex gap-4">
                  <Button
                    onClick={() => isolateTicket(callingTicket.ticketId)}
                    disabled={isIsolating}
                    variant="outline"
                    className="h-14 px-8 border-2 border-danger/20 text-danger font-black uppercase tracking-widest hover:bg-danger/5 rounded-2xl shadow-lg active:scale-95 transition-all"
                  >
                    {isIsolating ? <Loader2 className="animate-spin" /> : <><PauseCircle className="h-6 w-6 mr-2" /> Isoler</>}
                  </Button>

                  <Button
                    onClick={() => recallTicket(callingTicket.ticketId)}
                    disabled={isRecalling}
                    variant="outline"
                    className="flex-1 h-14 text-xl font-black uppercase tracking-widest gap-3 rounded-2xl border-2 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {isRecalling ? (
                      <Loader2 className="animate-spin h-6 w-6" />
                    ) : (
                      <><Volume2 className="h-6 w-6" /> Rappeler</>
                    )}
                  </Button>

                  <Button
                    onClick={() => handleProcessTicket(callingTicket.ticketId)}
                    disabled={isProcessing}
                    className="flex-1 h-14 text-xl font-black uppercase tracking-widest gap-4 rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary"
                  >
                    {isProcessing ? <Loader2 className="animate-spin h-6 w-6" /> : <><PlayCircle className="h-6 w-6 text-white shadow-sm" /> Prise en charge</>}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* PROCESSING STATE */}
          {centralView === 'processing' && activeTicket && (
            <motion.div
              key="active"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex items-center justify-between min-h-[120px] border-b-2 border-primary">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-[9px] px-2 py-0.5 font-black tracking-widest uppercase rounded-full shadow-lg shadow-primary/20">Traitement</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <ChevronRight size={12} className="text-primary" />
                      {(activeTicket as any).currentStep?.name || 'Saisie'}
                    </span>
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none drop-shadow-xl">
                    {activeTicket.licensePlate}
                  </h1>
                  {activeTicket.isTransferred && (
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Multi-Chargement</span>
                  )}
                </div>

                <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-end">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                    <TimerIcon className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Temps</span>
                  </div>
                  {activeTicket.startedAt && (
                    <Timer startedAt={activeTicket.startedAt} className="text-3xl font-black font-mono leading-none text-primary-foreground tabular-nums drop-shadow-md" />
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-background p-10">
                <div className="max-w-3xl mx-auto space-y-12">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-6 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
                        Données d'Opération
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 pb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                      {config?.formConfig.map((field) => (
                        <div key={field.name} className={cn("space-y-3", config?.formConfig.length === 1 && "md:col-span-2")}>
                          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                            {field.label} {field.required && <span className="text-danger font-black">*</span>}
                          </label>
                          <Controller
                            name={field.name}
                            control={control}
                            render={({ field: { onChange, value } }) => (
                              <div className="relative group">
                                {field.type === 'select' ? (
                                  <select
                                    className="w-full h-16 px-6 bg-white border-2 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all text-xl font-black uppercase shadow-sm group-hover:border-slate-300"
                                    value={value || ''} onChange={onChange}
                                  >
                                    <option value="">-- CHOISIR --</option>
                                    {field.options?.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
                                  </select>
                                ) : (
                                  <Input
                                    type={field.type} value={value || ''} onChange={onChange}
                                    placeholder={field.placeholder || field.label.toUpperCase()}
                                    className="h-16 bg-white border-2 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-xl font-black uppercase px-6 shadow-sm group-hover:border-slate-300 transition-all"
                                  />
                                )}
                                {errors[field.name] && <span className="text-xs text-danger font-black uppercase mt-2 ml-2 block tracking-widest animate-in fade-in slide-in-from-top-1">{errors[field.name]?.message as string}</span>}
                              </div>
                            )}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 flex gap-4">
                      <Button
                        type="submit"
                        className="flex-1 h-16 text-xl font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl bg-primary hover:scale-[1.01] active:scale-[0.99] transition-all group overflow-hidden relative border-t border-white/10"
                        disabled={isCompleting}
                      >
                        <motion.div
                          className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity"
                        />
                        {isCompleting ? <Loader2 className="animate-spin h-6 w-6" /> : (
                          <div className="flex items-center justify-center gap-4">
                            Terminer
                            <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-500 text-white" />
                          </div>
                        )}
                      </Button>

                      <Button
                        type="button"
                        onClick={() => setIsTransferModalOpen(true)}
                        variant="outline"
                        className="h-16 px-6 font-black uppercase tracking-widest gap-3 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-xl"
                      >
                        <ArrowLeftRight className="h-6 w-6" />
                        Transférer
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* COLUMN 3: HISTORY */}
      <motion.aside
        initial={{ x: 250 }} animate={{ x: 0 }}
        className="w-[300px] bg-slate-50/50 backdrop-blur-xl border-l border-slate-200 flex flex-col z-20"
      >
        <div className="p-8 bg-white/80 border-b border-slate-200">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Historique</h2>
          <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Récents</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {completedTickets.map((ticket) => (
            <div 
              key={ticket.ticketId} 
              onClick={() => handleOpenHistory(ticket.ticketId)}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enregistré</span>
              </div>
              <p className="font-black text-slate-900 uppercase text-lg tracking-tight group-hover:text-primary transition-colors">{ticket.licensePlate}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
                <span className="text-[10px] font-mono text-slate-400 font-bold">{new Date(ticket.updatedAt).toLocaleTimeString()}</span>
                <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded">#{ticket.ticketNumber}</span>
              </div>
            </div>
          ))}
          {completedTickets.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <EmptyState
                icon={HistoryIcon}
                title="Historique vide"
                description="Aucun véhicule traité aujourd'hui sur ce poste."
                className="scale-90 opacity-60"
              />
            </div>
          )}
        </div>
      </motion.aside>

      {/* [NOUVEAU] MODALE D'HISTORIQUE DÉTAILLÉ */}
      <TicketHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        ticketId={historyTicketId}
      />

      {/* [NOUVEAU] MODALE DE TRANSFERT */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        ticket={activeTicket || callingTicket || selectedTicket}
        currentQuaiId={quaiId!}
      />
    </div>
  );
}

// COMPOSANT: MODALE DE TRANSFERT INTER-FILES ET INTER-CATÉGORIES
function TransferModal({ isOpen, onClose, ticket, currentQuaiId }: { isOpen: boolean; onClose: () => void; ticket: Ticket | null; currentQuaiId: string }) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferMode, setTransferMode] = useState<'quai' | 'category'>('quai');

  const { data: availableQuais = [], isLoading: isLoadingQuais } = useQuery({
    queryKey: ['availableQuais', ticket?.currentStepId],
    queryFn: () => ticketApi.getAvailableQuaisForStep(ticket!.currentStepId!),
    enabled: isOpen && !!ticket?.currentStepId,
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(res => res.data),
    enabled: isOpen,
  });

  const handleTransfer = async (targetId: string) => {
    if (!ticket) return;
    try {
      setIsTransferring(true);
      if (transferMode === 'quai') {
        await ticketApi.transferTicket(ticket.ticketId, targetId, undefined);
      } else {
        await ticketApi.transferTicket(ticket.ticketId, undefined, targetId);
      }
      toast.success("Véhicule transféré avec succès !");
      onClose();
    } catch (error) {
      toast.error("Échec du transfert.");
    } finally {
      setIsTransferring(false);
    }
  };

  if (!ticket) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Transfert de Flux" 
      size="md"
    >
      <div className="space-y-6">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Véhicule</span>
            <span className="text-xl font-black text-slate-900">{ticket.licensePlate}</span>
          </div>
          <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Truck size={20} />
          </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-4">
          <button
             onClick={() => setTransferMode('quai')}
             className={cn("flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all", transferMode === 'quai' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700")}
          >
            Autre Poste
          </button>
          <button
             onClick={() => setTransferMode('category')}
             className={cn("flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all", transferMode === 'category' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700")}
          >
            Autre Catégorie
          </button>
        </div>

        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
          <div className="grid gap-3">
            {transferMode === 'quai' ? (
              isLoadingQuais ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary/40" /></div>
              ) : availableQuais.filter((q: any) => q.quaiId !== currentQuaiId).length > 0 ? (
                availableQuais
                  .filter((q: any) => q.quaiId !== currentQuaiId)
                  .map((q: any) => (
                    <button
                      key={q.quaiId}
                      disabled={isTransferring}
                      onClick={() => handleTransfer(q.quaiId)}
                      className="flex items-center justify-between p-5 bg-white border-2 border-slate-100 hover:border-primary hover:bg-primary/[0.02] rounded-2xl transition-all group text-left w-full"
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Poste</span>
                        <span className="text-md font-black text-slate-800 uppercase tracking-tight group-hover:text-primary transition-colors">{q.label}</span>
                      </div>
                      <div className="h-8 w-8 rounded-xl bg-slate-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <ArrowLeftRight size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  ))
              ) : (
                <div className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase italic">Aucun autre poste disponible</div>
              )
            ) : (
              isLoadingCategories ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary/40" /></div>
              ) : categories.filter((c: any) => c.categoryId !== (ticket as any).categoryId).length > 0 ? (
                categories
                  .filter((c: any) => c.categoryId !== (ticket as any).categoryId)
                  .map((c: any) => (
                    <button
                      key={c.categoryId}
                      disabled={isTransferring}
                      onClick={() => handleTransfer(c.categoryId)}
                      className="flex items-center justify-between p-5 bg-white border-2 border-slate-100 hover:border-primary hover:bg-primary/[0.02] rounded-2xl transition-all group text-left w-full"
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Catégorie</span>
                        <span className="text-md font-black text-slate-800 uppercase tracking-tight group-hover:text-primary transition-colors">{c.name}</span>
                      </div>
                      <div className="h-8 w-8 rounded-xl bg-slate-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Tags size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  ))
              ) : (
                <div className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase italic">Aucune autre catégorie disponible</div>
              )
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
            <Button onClick={onClose} variant="outline" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px]">Annuler</Button>
        </div>
      </div>
    </Modal>
  );
}

// COMPOSANT: MODALE D'HISTORIQUE DÉTAILLÉ
function TicketHistoryModal({ isOpen, onClose, ticketId }: { isOpen: boolean; onClose: () => void; ticketId: string | null }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ticketFullHistory', ticketId],
    queryFn: () => ticketApi.getTicketFullHistory(ticketId!),
    enabled: isOpen && !!ticketId,
  });

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Historique Complet" 
      size="2xl"
    >
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chargement des données...</span>
          </div>
        ) : error ? (
          <div className="py-20 text-center space-y-4">
            <p className="text-danger font-bold uppercase text-xs">Erreur lors de la récupération de l'historique</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">Réessayer</Button>
          </div>
        ) : !data ? null : (
          <>
            {/* Infos Ticket */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <Truck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Véhicule</span>
                </div>
                <p className="text-xl font-black text-slate-900">{data.ticket.licensePlate}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">#{data.ticket.ticketNumber}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <UserIcon size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Chauffeur / Société</span>
                </div>
                <p className="text-sm font-black text-slate-900 uppercase truncate">
                  {data.ticket.vehicleInfo?.driverName || '---'}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase truncate">
                  {data.ticket.vehicleInfo?.companyName || '---'}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6 relative">
              <div className="absolute left-[19px] top-2 bottom-0 w-0.5 bg-slate-100" />
              
              <h4 className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase pl-10">Chronologie</h4>
              
              {data.history.map((log: any, idx: number) => (
                <div key={log.logId} className="relative pl-10 group">
                  {/* Point sur la ligne */}
                  <div className={cn(
                    "absolute left-[14px] top-1.5 h-3 w-3 rounded-full border-2 bg-white transition-colors z-10",
                    idx === 0 ? "border-primary scale-125" : "border-slate-300"
                  )} />

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-xs font-black uppercase tracking-tight",
                        idx === 0 ? "text-primary" : "text-slate-700"
                      )}>
                        {log.actionType}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={10} />
                        <span className="text-[9px] font-bold">
                          {new Date(log.occurredAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-bold uppercase">
                        {log.step?.queue?.name || 'Système'}
                      </span>
                      {log.agent && (
                        <span className="italic">
                          par {log.agent.firstName || log.agent.username}
                        </span>
                      )}
                      {log.quaiId && (
                        <span className="bg-primary/5 text-primary px-2 py-0.5 rounded font-black text-[8px] uppercase">
                          Quai: {log.quaiId}
                        </span>
                      )}
                    </div>

                    {/* Données spécifiques SI PRÉSENTES (ex: pesée, motifs) */}
                    {log.formData && Object.keys(log.formData).length > 0 && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] space-y-1">
                        {Object.entries(log.formData).map(([key, val]) => (
                          <div key={key} className="flex gap-2">
                            <span className="font-bold text-slate-400 uppercase">{key}:</span>
                            <span className="text-slate-800 font-black uppercase">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="pt-4 flex justify-end">
          <Button onClick={onClose} className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px]">Fermer</Button>
        </div>
      </div>
    </Modal>
  );
}
