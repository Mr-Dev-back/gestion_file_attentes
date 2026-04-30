import { motion } from 'framer-motion';
import { Loader2, Phone, LogOut, Clock } from 'lucide-react';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../../lib/utils';
import { Button } from '../../atoms/ui/button';
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

        <Button
          onClick={onCallNext}
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
            onClick={() => onSelectTicket(ticket)}
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
