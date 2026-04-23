import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Save, Truck, Edit3, Loader2 } from 'lucide-react';
import type { Ticket } from '../../types/ticket';
import { getRecentOutVehicles } from '../../services/supervisorApi';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';
import { Button } from '../atoms/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RecentOutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecentOutDrawer({ isOpen, onClose }: RecentOutDrawerProps) {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchRecent = async () => {
    const siteId = (user as any)?.siteId;
    if (!siteId || !isOpen) return;
    
    try {
      setIsLoading(true);
      const data = await getRecentOutVehicles(siteId);
      setTickets(data);
    } catch (error) {
      toast.error("Impossible de charger l'historique");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, [isOpen, (user as any)?.siteId]);

  const handleUpdate = async (ticketId: string, updates: Partial<Ticket>) => {
    try {
      toast.loading("Mise à jour...", { id: 'update-ticket' });
      await api.patch(`/tickets/${ticketId}`, updates);
      toast.success("Modifications enregistrées", { id: 'update-ticket' });
      setEditingId(null);
      fetchRecent();
    } catch (error) {
      toast.error("Erreur lors de la modification", { id: 'update-ticket' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[70] h-screen w-full max-w-md bg-white/95 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.1)] border-l border-white/50 flex flex-col"
          >
            {/* Header */}
            <div className="p-8 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-2xl text-slate-800">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase leading-none">Historique Sorties</h2>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Dernières 50 opérations</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {isLoading && tickets.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary/20" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 italic opacity-40">
                  <Truck className="w-16 h-16" />
                  <p className="font-black uppercase tracking-widest text-[10px]">Aucune sortie récente</p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <HistoryItem 
                    key={ticket.ticketId} 
                    ticket={ticket} 
                    isEditing={editingId === ticket.ticketId}
                    onEdit={() => setEditingId(ticket.ticketId)}
                    onCancel={() => setEditingId(null)}
                    onSave={(updates: Partial<Ticket>) => handleUpdate(ticket.ticketId, updates)}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function HistoryItem({ ticket, isEditing, onEdit, onCancel, onSave }: any) {
  const [weight, setWeight] = useState(ticket.weightOut || 0);

  return (
    <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-lg shadow-black/5 relative group hover:border-primary/20 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-widest mb-1">Plaque / Ticket</span>
          <span className="text-base font-black text-slate-800 tracking-tight uppercase">
            {ticket.licensePlate} <span className="text-slate-300 font-medium mx-1">|</span> {ticket.ticketNumber}
          </span>
        </div>
        <div className="bg-slate-50 px-2 py-1 rounded-lg">
          <span className="text-[10px] font-black text-slate-500">
            {ticket.completedAt ? format(new Date(ticket.completedAt), 'HH:mm', { locale: fr }) : '--:--'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <span className="text-[8px] font-black text-slate-400 block uppercase tracking-widest mb-1">Poids Sortie</span>
          {isEditing ? (
            <input 
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full text-sm font-black text-primary focus:outline-none bg-transparent"
              autoFocus
            />
          ) : (
            <span className="text-sm font-black text-slate-700">{ticket.weightOut || '0'} kg</span>
          )}
        </div>
        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <span className="text-[8px] font-black text-slate-400 block uppercase tracking-widest mb-1">Quai Affecté</span>
          <span className="text-sm font-black text-slate-700">{ticket.quai?.label || 'Direct'}</span>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
        {isEditing ? (
          <>
            <Button variant="ghost" onClick={onCancel} className="h-9 px-4 text-[10px] font-black rounded-xl uppercase">Annuler</Button>
            <Button onClick={() => onSave({ weightOut: weight })} className="h-9 px-4 bg-primary text-white text-[10px] font-black rounded-xl uppercase gap-2 shadow-lg shadow-primary/20">
              <Save className="w-3.5 h-3.5" /> Enregistrer
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={onEdit} className="h-9 px-4 border-slate-200 text-slate-600 hover:text-primary hover:border-primary/20 text-[10px] font-black rounded-xl uppercase gap-2 bg-white">
            <Edit3 className="w-3.5 h-3.5" /> Modifier
          </Button>
        )}
      </div>
    </div>
  );
}
