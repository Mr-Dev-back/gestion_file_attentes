import { motion } from 'framer-motion';
import { Volume2, VolumeX, Loader2, Phone, LogOut, Clock } from 'lucide-react';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../../lib/utils';
import { Button } from '../../atoms/ui/button';
import { soundAlerts } from '../../../utils/soundAlerts';
import { useEffect, useRef, useState } from 'react';
import type { Ticket } from '../../../types/ticket';

interface SmartQuaiSidebarProps {
  waitingTickets: Ticket[];
  selectedTicket: Ticket | null;
  onSelectTicket: (ticket: Ticket) => void;
  isCalling: boolean;
  onCallNext: () => void;
  onLogout: () => void;
  queueName?: string;
  categoryId?: string | null;
}

export function SmartQuaiSidebar({
  waitingTickets,
  selectedTicket,
  onSelectTicket,
  isCalling,
  onCallNext,
  onLogout,
  queueName,
  categoryId
}: SmartQuaiSidebarProps) {
  const [isMuted, setIsMuted] = useState(false);
  const alertedTickets = useRef<Set<string>>(new Set());
  const prevCount = useRef(waitingTickets.length);

  // Sound Alerts Logic
  useEffect(() => {
    if (isMuted) return;

    // 1. Alert for new tickets
    if (waitingTickets.length > prevCount.current) {
      soundAlerts.playNewTicket();
    }
    prevCount.current = waitingTickets.length;

    // 2. Alert for wait thresholds
    waitingTickets.forEach(ticket => {
      const diff = differenceInMinutes(new Date(), new Date(ticket.arrivedAt));
      
      // Threshold 45 min (Critical)
      if (diff >= 45 && !alertedTickets.current.has(ticket.ticketId + '-critical')) {
        soundAlerts.playCritical();
        alertedTickets.current.add(ticket.ticketId + '-critical');
      } 
      // Threshold 30 min (Urgent)
      else if (diff >= 30 && diff < 45 && !alertedTickets.current.has(ticket.ticketId + '-urgent')) {
        soundAlerts.playUrgent();
        alertedTickets.current.add(ticket.ticketId + '-urgent');
      }
    });

    // Cleanup: remove tickets no longer in the list
    const currentIds = new Set(waitingTickets.map(t => t.ticketId));
    const toRemove: string[] = [];
    alertedTickets.current.forEach(key => {
      const id = key.split('-')[0];
      if (!currentIds.has(id)) {
        toRemove.push(key);
      }
    });
    toRemove.forEach(key => alertedTickets.current.delete(key));

  }, [waitingTickets, isMuted]);

  return (
    <motion.aside
      initial={{ x: -300 }} animate={{ x: 0 }}
      className="w-[320px] bg-slate-50/50 backdrop-blur-xl border-r border-slate-200 flex flex-col z-20 shadow-xl"
    >
      <div className="p-8 bg-white/80 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">File d'Attente</h2>
              {queueName && categoryId && (
                <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
                  Filtré: {queueName}
                </span>
              )}
            </div>
            <p className="text-xl font-black text-slate-800 tracking-tighter uppercase">Véhicules</p>
          </div>
          <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded">
            {waitingTickets.length}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onCallNext}
            disabled={isCalling || !waitingTickets.some(t => t.status === 'EN_ATTENTE')}
            className="flex-1 h-10 bg-gradient-to-r from-primary to-primary/80 font-black uppercase tracking-widest text-[10px] gap-2 rounded-xl shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            {isCalling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Phone className="h-3 w-3" />}
            Appeler Suivant
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "h-10 w-10 rounded-xl border-2 transition-all",
              isMuted ? "text-slate-400 border-slate-200" : "text-primary border-primary/20 bg-primary/5"
            )}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
        {waitingTickets.map((ticket) => {
          const diff = differenceInMinutes(new Date(), new Date(ticket.arrivedAt));
          const isCritical = diff >= 45;
          const isWarning = diff >= 30 && diff < 45;

          return (
            <motion.div
              layout
              key={ticket.ticketId}
              onClick={() => onSelectTicket(ticket)}
              whileHover={{ x: 6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "p-6 rounded-3xl border-2 transition-all cursor-pointer shadow-sm relative overflow-hidden group/item",
                selectedTicket?.ticketId === ticket.ticketId
                  ? "bg-white border-primary shadow-xl ring-4 ring-primary/5"
                  : isCritical
                    ? "bg-red-50/80 border-red-200 animate-pulse-subtle shadow-red-100"
                    : isWarning
                      ? "bg-amber-50/80 border-amber-200 shadow-amber-100"
                      : ticket.status === 'CALLING'
                        ? "bg-white border-amber-400 shadow-md ring-2 ring-amber-100"
                        : "bg-white/40 border-slate-100 hover:border-slate-300 hover:bg-white hover:shadow-lg"
              )}
            >
              {isCritical && (
                <div className="absolute top-0 right-0 p-1.5 bg-red-600 text-white rounded-bl-xl z-10 shadow-lg">
                  <Clock className="h-3 w-3 animate-spin-slow" />
                </div>
              )}

              {selectedTicket?.ticketId === ticket.ticketId && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
              )}
              
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-mono font-bold text-slate-400">#{ticket.ticketNumber}</span>
                <div className="flex gap-1">
                  {isCritical && (
                    <span className="text-[7px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm">Critique</span>
                  )}
                  {isWarning && !isCritical && (
                    <span className="text-[7px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm">Urgent</span>
                  )}
                  {ticket.status === 'CALLING' && (
                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest animate-pulse">Appelé</span>
                  )}
                </div>
              </div>
              
              <p className="text-lg font-black text-slate-800 uppercase tracking-tight">{ticket.licensePlate}</p>
              
              <div className="flex flex-col gap-1">
                <p className="text-[9px] text-slate-500 font-bold uppercase truncate">
                  {(ticket as any).driverName || (ticket as any).companyName || 'En attente'}
                </p>
                <div className="flex items-center gap-1.5 mt-1 border-t border-slate-100 pt-1">
                  {(() => {
                    const colorClass = isCritical ? 'text-red-600 font-black' : isWarning ? 'text-amber-600 font-black' : 'text-slate-400 font-bold';
                    return (
                      <>
                        <Clock className={cn("h-3 w-3", colorClass)} />
                        <span className={cn("text-[9px] uppercase tracking-tight", colorClass)}>
                          {formatDistanceToNow(new Date(ticket.arrivedAt), { addSuffix: true, locale: fr })}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          );
        })}
        {waitingTickets.length === 0 && (
          <div className="py-20 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">
            Aucun véhicule
          </div>
        )}
        <div className="p-4 border-t border-slate-50 bg-white">
          <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full h-12 justify-start text-red-500 hover:bg-red-50 hover:text-red-600 rounded-2xl font-bold transition-all justify-center px-0"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="ml-3 uppercase tracking-widest text-xs">Déconnexion</span>
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}
