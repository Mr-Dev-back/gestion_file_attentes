import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, ArrowRightLeft, ShieldAlert, Loader2, Info } from 'lucide-react';
import type { Ticket, WorkflowStep } from '../../types/ticket';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';
import { updateVehiclePriority, forceStepJump } from '../../services/supervisorApi';
import { Button } from '../atoms/ui/button';
import { toast } from 'sonner';
import { getSortedQueue, getPriorityClass } from '../../utils/priorityLogic';

interface Zone {
  id: string;
  label: string;
  order: number;
}

const ZONES: Zone[] = [
  { id: 'attente', label: 'ATTENTE', order: 1 },
  { id: 'pesee_entree', label: 'PESÉE ENTRÉE', order: 2 },
  { id: 'chargement', label: 'CHARGEMENT', order: 3 },
  { id: 'sortie', label: 'SORTIE', order: 4 },
];

export function WorkflowSynoptic() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const siteId = (user as any)?.siteId;
      if (!siteId) return;

      // 1. Récupérer les étapes du workflow du site pour le mapping
      const siteResponse = await api.get(`/sites/${siteId}`);
      const workflowId = siteResponse.data.workflowId;
      const stepsResponse = await api.get<WorkflowStep[]>(`/workflows/${workflowId}/steps`);
      setWorkflowSteps(stepsResponse.data.sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)));

      // 2. Récupérer les tickets
      await fetchTickets();
    } catch (error) {
      console.error("Erreur initialisation synoptique:", error);
      toast.error("Échec du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await api.get<Ticket[]>('/tickets', {
        params: { 
          siteId: (user as any)?.siteId,
          status: ['EN_ATTENTE', 'CALLING', 'PROCESSING', 'ISOLE']
        }
      });
      setTickets(response.data);
    } catch (error) {
      console.error("Erreur refresh tickets:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, [(user as any)?.siteId]);

  const handlePriority = async (ticketId: string, currentPriority: number) => {
    try {
      const nextPriority = currentPriority === 2 ? 0 : currentPriority + 1;
      await updateVehiclePriority(ticketId, nextPriority, "Régulation Superviseur");
      toast.success("Priorité mise à jour");
      fetchTickets();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de la priorité");
    }
  };

  const handleDrop = async (zoneOrder: number) => {
    if (!draggedTicketId) return;
    
    // Trouver l'étape correspondant à l'ordre de la zone
    const targetStep = workflowSteps.find(s => s.orderNumber === zoneOrder);
    if (!targetStep) {
      toast.error("Étape non configurée pour cette zone");
      return;
    }

    const ticket = tickets.find(t => t.ticketId === draggedTicketId);
    if (ticket?.currentStepId === targetStep.stepId) {
      setDraggedTicketId(null);
      return;
    }

    try {
      toast.loading("Transfert en cours...", { id: 'transfer' });
      await forceStepJump(draggedTicketId, targetStep.stepId);
      toast.success("Véhicule déplacé avec succès", { id: 'transfer' });
      fetchTickets();
    } catch (error) {
      toast.error("Erreur lors du transfert manuel", { id: 'transfer' });
    } finally {
      setDraggedTicketId(null);
    }
  };

  const getTicketsInZone = (order: number) => {
    const filtered = tickets.filter(t => t.currentStep?.orderNumber === order);
    return getSortedQueue(filtered);
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[600px]">
      {ZONES.map(zone => (
        <div 
          key={zone.id} 
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(zone.order)}
          className={`flex flex-col bg-white/40 backdrop-blur-md border transition-all duration-500 ${
            draggedTicketId ? 'border-primary/40 ring-4 ring-primary/5 bg-white/60' : 'border-white/60'
          } rounded-[2rem] overflow-hidden shadow-xl shadow-black/5`}
        >
          {/* Zone Header */}
          <div className="bg-white/40 backdrop-blur-md p-5 flex items-center justify-between border-b border-white/60">
            <h3 className="font-black tracking-tighter text-sm text-slate-800 uppercase">{zone.label}</h3>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-black text-[10px] tracking-tight">
              {getTicketsInZone(zone.order).length} VÉHICULES
            </span>
          </div>

          {/* Zone Body */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[750px] no-scrollbar">
            <AnimatePresence mode="popLayout">
              {getTicketsInZone(zone.order).map(ticket => (
                <TicketCard 
                  key={ticket.ticketId} 
                  ticket={ticket} 
                  onPriority={() => handlePriority(ticket.ticketId, ticket.priority)}
                  onDragStart={() => setDraggedTicketId(ticket.ticketId)}
                  onDragEnd={() => setDraggedTicketId(null)}
                />
              ))}
            </AnimatePresence>
            
            {getTicketsInZone(zone.order).length === 0 && (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/50 rounded-2xl opacity-40">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zone Vide</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface TicketCardProps {
  ticket: Ticket;
  onPriority: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function TicketCard({ ticket, onPriority, onDragStart, onDragEnd }: TicketCardProps) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const start = new Date(ticket.startedAt || ticket.arrivedAt).getTime();
      const diff = Math.floor((Date.now() - start) / 1000 / 60);
      setElapsed(`${diff}m`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [ticket.startedAt, ticket.arrivedAt]);

  const isLate = parseInt(elapsed) > 30;
  
  return (
    <motion.div
      layout
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", damping: 25, stiffness: 400 }}
      className={`relative bg-white/90 backdrop-blur-sm border border-slate-100 p-5 rounded-2xl shadow-lg shadow-black/5 cursor-grab active:cursor-grabbing group hover:border-primary/30 transition-all overflow-hidden`}
    >
      {/* Decorative side bar for priority */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${
        ticket.priority >= 2 ? 'bg-red-500' : ticket.priority === 1 ? 'bg-amber-500' : 'bg-primary'
      }`} />

      {/* License Plate */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Immatriculation</span>
            {ticket.isTransferred && (
              <span className="bg-slate-100 text-slate-600 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-slate-200">TRANSFÉRÉ</span>
            )}
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-800 uppercase leading-none">
            {ticket.licensePlate || '---'}
          </span>
        </div>
        <div className={`p-2.5 rounded-xl ${isLate ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* Info Rows */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Temps Site</span>
          <span className={`text-sm font-black tracking-tight ${isLate ? 'text-red-600' : 'text-slate-700'}`}>{elapsed}</span>
        </div>
        <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Position</span>
          <span className="text-sm font-black text-slate-700 tracking-tight">#{(ticket as any).position || 'N/A'}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onPriority(); }}
          className={`flex-1 h-10 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${
            ticket.priority >= 2 
              ? 'bg-red-500 text-white border-red-400 shadow-md shadow-red-500/20' 
              : ticket.priority === 1 
              ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/20' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${ticket.priority > 0 ? 'fill-current' : ''}`} />
          {ticket.priority >= 2 ? 'Priorité Critique' : ticket.priority === 1 ? 'Priorité Haute' : 'Normal'}
        </button>
      </div>

      {/* Hover visual cue */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-primary/5 p-1 rounded-lg">
          <ArrowRightLeft className="w-3 h-3 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}
