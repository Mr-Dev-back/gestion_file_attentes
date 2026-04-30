import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, ShieldAlert, Loader2 } from 'lucide-react';
import type { Ticket, WorkflowStep } from '../../types/ticket';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';
import { updateVehiclePriority, forceStepJump } from '../../services/supervisorApi';
import { Button } from '../atoms/ui/button';
import { toast } from 'sonner';
import { getSortedQueue, getPriorityGlowClass, getPriorityBadge } from '../../utils/priorityLogic';

// ─── Zone definitions (order must match WorkflowStep.orderNumber) ───────────
interface Zone {
  id: string;
  label: string;
  order: number;
  accent: string;
  dot: string;
}

const ZONES: Zone[] = [
  { id: 'attente',      label: 'ATTENTE',      order: 1, accent: 'border-t-slate-400',   dot: 'bg-slate-400'   },
  { id: 'pesee_entree', label: 'PESÉE ENTRÉE', order: 2, accent: 'border-t-blue-500',    dot: 'bg-blue-500'    },
  { id: 'chargement',   label: 'CHARGEMENT',   order: 3, accent: 'border-t-indigo-500',  dot: 'bg-indigo-500'  },
  { id: 'sortie',       label: 'SORTIE',        order: 4, accent: 'border-t-emerald-500', dot: 'bg-emerald-500' },
];

// Spring transition matching SiteMap's sidebar animation
const SPRING = { type: 'spring', damping: 25, stiffness: 200 };

// ─── Main Component ──────────────────────────────────────────────────────────
export function WorkflowSynoptic() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dropTargetZone, setDropTargetZone] = useState<number | null>(null);

  const fetchTickets = async () => {
    try {
      const response = await api.get<Ticket[]>('/tickets', {
        params: {
          siteId: (user as any)?.siteId,
          status: ['EN_ATTENTE', 'CALLING', 'PROCESSING', 'ISOLE'],
        },
      });
      setTickets(response.data);
    } catch (err) {
      console.error('Erreur refresh tickets:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const siteId = (user as any)?.siteId;
        if (!siteId) return;

        // Fetch workflow steps for this site
        const siteRes = await api.get(`/sites/${siteId}`);
        const workflowId = siteRes.data?.workflowId;
        if (workflowId) {
          const stepsRes = await api.get<WorkflowStep[]>(`/workflows/${workflowId}/steps`);
          setWorkflowSteps(
            [...stepsRes.data].sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0))
          );
        }
        await fetchTickets();
      } catch (err) {
        console.error('Erreur initialisation synoptique:', err);
        toast.error('Chargement des données impossible');
      } finally {
        setIsLoading(false);
      }
    };

    init();
    const interval = setInterval(fetchTickets, 10_000);
    return () => clearInterval(interval);
  }, [(user as any)?.siteId]);

  const handlePriority = async (ticketId: string, current: number) => {
    const next = current >= 2 ? 0 : current + 1;
    const { label } = getPriorityBadge(next);
    try {
      await updateVehiclePriority(ticketId, next, 'Régulation Superviseur');
      toast.success(`Priorité → ${label}`);
      fetchTickets();
    } catch {
      toast.error('Impossible de mettre à jour la priorité');
    }
  };

  const handleDrop = async (zoneOrder: number) => {
    setDropTargetZone(null);
    if (!draggedTicketId) return;

    const targetStep = workflowSteps.find(s => s.orderNumber === zoneOrder);
    if (!targetStep) { toast.error('Étape non configurée'); return; }

    const ticket = tickets.find(t => t.ticketId === draggedTicketId);
    if (ticket?.currentStepId === targetStep.stepId) { setDraggedTicketId(null); return; }

    const toastId = 'transfer';
    try {
      toast.loading('Transfert en cours…', { id: toastId });
      await forceStepJump(draggedTicketId, targetStep.stepId);
      toast.success('Véhicule déplacé avec succès', { id: toastId });
      fetchTickets();
    } catch {
      toast.error('Erreur lors du transfert manuel', { id: toastId });
    } finally {
      setDraggedTicketId(null);
    }
  };

  const getZoneTickets = (order: number) =>
    getSortedQueue(tickets.filter(t => t.currentStep?.orderNumber === order));

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {ZONES.map(zone => {
        const zoneTickets = getZoneTickets(zone.order);
        const isDropTarget = dropTargetZone === zone.order && draggedTicketId !== null;

        return (
          <div
            key={zone.id}
            onDragOver={e => { e.preventDefault(); setDropTargetZone(zone.order); }}
            onDragLeave={() => setDropTargetZone(null)}
            onDrop={() => handleDrop(zone.order)}
            className={`flex flex-col bg-white/50 backdrop-blur-sm rounded-[2rem] border transition-all duration-300 overflow-hidden ${
              isDropTarget
                ? 'border-indigo-400 ring-4 ring-indigo-400/20 shadow-xl shadow-indigo-500/10 scale-[1.01]'
                : 'border-white shadow-lg shadow-black/5'
            } ${zone.accent} border-t-4`}
          >
            {/* Zone header */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${zone.dot}`} />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {zone.label}
                </h3>
              </div>
              <span className="text-xs font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                {zoneTickets.length}
              </span>
            </div>

            {/* Ticket list */}
            <div className="flex-1 px-3 pb-3 space-y-3 overflow-y-auto max-h-[640px] no-scrollbar">
              <AnimatePresence mode="popLayout">
                {zoneTickets.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-10 text-center text-slate-300 text-xs font-black uppercase tracking-widest"
                  >
                    Aucun véhicule
                  </motion.div>
                ) : (
                  zoneTickets.map(ticket => (
                    <TicketCard
                      key={ticket.ticketId}
                      ticket={ticket}
                      onPriority={() => handlePriority(ticket.ticketId, ticket.priority)}
                      onDragStart={() => setDraggedTicketId(ticket.ticketId)}
                      onDragEnd={() => { setDraggedTicketId(null); setDropTargetZone(null); }}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Ticket Card ─────────────────────────────────────────────────────────────
interface TicketCardProps {
  ticket: Ticket;
  onPriority: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function TicketCard({ ticket, onPriority, onDragStart, onDragEnd }: TicketCardProps) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const calc = () => {
      const ms = Date.now() - new Date(ticket.startedAt || ticket.arrivedAt).getTime();
      const min = Math.floor(ms / 60_000);
      setElapsed(min < 60 ? `${min}m` : `${Math.floor(min / 60)}h${min % 60}m`);
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [ticket.startedAt, ticket.arrivedAt]);

  const isLate = parseInt(elapsed) > 30;
  const glowClass = getPriorityGlowClass(ticket.priority);
  const badge = getPriorityBadge(ticket.priority);

  return (
    <motion.div
      layout
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -3 }}
      transition={SPRING}
      className={`relative bg-white/80 backdrop-blur-md rounded-2xl border border-white p-4 shadow-md shadow-black/5 cursor-grab active:cursor-grabbing ${glowClass}`}
    >
      {/* Priority dot */}
      {ticket.priority > 0 && (
        <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg ${
          ticket.priority >= 2 ? 'bg-red-500' : 'bg-amber-500'
        }`}>
          <Zap className="w-2.5 h-2.5 text-white fill-white" />
        </div>
      )}

      {/* Plate + elapsed */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Plaque</p>
          <p className="text-base font-black text-slate-800 tracking-tight leading-none">
            {ticket.licensePlate || '---'}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black ${
          isLate ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
        }`}>
          <Clock className="w-3 h-3" />
          {elapsed || '0m'}
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-bold text-slate-400 truncate max-w-[100px]">
          {ticket.category?.name || 'Général'}
        </span>
        {ticket.isTransferred && (
          <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
            MANUEL
          </span>
        )}
      </div>

      {/* Priority action */}
      <Button
        variant="ghost"
        onClick={e => { e.stopPropagation(); onPriority(); }}
        className={`w-full h-8 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
          ticket.priority >= 2
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : ticket.priority === 1
            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
            : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
        }`}
      >
        <ShieldAlert className="w-3 h-3 mr-1.5" />
        {badge.label}
      </Button>
    </motion.div>
  );
}
