import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, CheckCircle2 } from 'lucide-react';
import type { Ticket } from '../../../types/ticket';

interface SmartQuaiHistoryProps {
  completedTickets: Ticket[];
  onOpenHistory: (ticketId: string) => void;
}

export function SmartQuaiHistory({ completedTickets, onOpenHistory }: SmartQuaiHistoryProps) {
  return (
    <motion.aside
      initial={{ x: 250 }} animate={{ x: 0 }}
      className="w-[300px] bg-slate-50/50 backdrop-blur-xl border-l border-slate-200 flex flex-col z-20"
    >
      <div className="p-8 bg-white/80 border-b border-slate-200">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Historique</h2>
        <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Récents</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {completedTickets.map((ticket) => (
          <div
            key={ticket.ticketId}
            onClick={() => onOpenHistory(ticket.ticketId)}
            className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                #{ticket.ticketNumber}
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">{ticket.licensePlate}</p>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="h-3 w-3" />
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {formatDistanceToNow(new Date(ticket.updatedAt || ticket.arrivedAt), { addSuffix: true, locale: fr })}
              </span>
            </div>
          </div>
        ))}
        {completedTickets.length === 0 && (
          <div className="py-20 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">
            Aucun historique récent
          </div>
        )}
      </div>
    </motion.aside>
  );
}
