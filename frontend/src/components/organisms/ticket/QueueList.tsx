import { Clock, Truck, ShieldAlert } from 'lucide-react';
import { Badge } from '../../atoms/ui/badge';
import { TicketStatusBadge } from '../../atoms/ticket/TicketStatusBadge';
import type { Ticket } from '../../../types/ticket';
import { cn } from '../../../lib/utils';

interface QueueListProps {
    tickets: Ticket[];
    selectedTicketId?: string;
    onSelect: (ticket: Ticket) => void;
    emptyMessage?: string;
    showTime?: boolean;
    showPriority?: boolean;
}

export function QueueList({
    tickets,
    selectedTicketId,
    onSelect,
    emptyMessage = "Aucun ticket",
    showTime = true,
    showPriority = true
}: QueueListProps) {
    if (!tickets || tickets.length === 0) {
        return (
            <div className="p-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <Truck className="w-10 h-10 mx-auto mb-3 opacity-10 text-slate-400" />
                <p className="text-sm font-bold text-slate-400 italic">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tickets.map((ticket) => {
                const isSelected = selectedTicketId === ticket.ticketId;
                const isHighPriority = (ticket.priority || 0) > 0;

                return (
                    <div
                        key={ticket.ticketId}
                        onClick={() => onSelect(ticket)}
                        className={cn(
                            "p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group",
                            isSelected
                                ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-[1.02] z-10"
                                : isHighPriority
                                    ? "border-orange-100 bg-orange-50/50 hover:border-orange-200 hover:bg-orange-50"
                                    : "border-slate-100 bg-white hover:border-primary/20 hover:shadow-lg hover:shadow-slate-100"
                        )}
                    >
                        {/* Priority Indicator */}
                        {isHighPriority && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
                        )}

                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={cn(
                                        "font-black text-xl tracking-tighter",
                                        isSelected ? "text-primary" : "text-text-main"
                                    )}>
                                        {ticket.ticketNumber}
                                    </span>
                                    
                                    {showPriority && isHighPriority && (
                                        <Badge variant="warning" className="text-[9px] h-4 px-1 font-black uppercase flex items-center gap-0.5">
                                            <ShieldAlert className="w-2.5 h-2.5" />
                                            Prio
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
                                        {ticket.category?.name || 'Standard'}
                                    </div>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <div className="text-xs font-black text-text-main font-mono">
                                        {ticket.licensePlate}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-3">
                                    {showTime && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted bg-slate-100 px-2 py-0.5 rounded-lg">
                                            <Clock className="w-3 h-3 text-primary" />
                                            {ticket.arrivedAt ? new Date(ticket.arrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </div>
                                    )}
                                    <div className="text-[10px] font-bold text-text-muted truncate max-w-[120px]">
                                        {ticket.companyName || 'Passager'}
                                    </div>
                                </div>
                            </div>

                            <div className="ml-3 flex flex-col items-end gap-2">
                                <TicketStatusBadge status={ticket.status} className="text-[9px] px-2 py-0.5 font-black uppercase rounded-lg shadow-sm" />
                                
                                {ticket.recallCount > 0 && (
                                    <span className="text-[9px] font-black text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">
                                        {ticket.recallCount} Rappels
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
