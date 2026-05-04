import { useState } from 'react';
import {
    Eye,
    Calendar,
    Clock,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Search,
    Truck,
    Building2,
    CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import type { Ticket } from '../../types/ticket';

interface AnalyticsTicketTableProps {
    tickets: Ticket[];
    onViewDetails: (ticketId: string) => void;
}

export default function AnalyticsTicketTable({ tickets, onViewDetails }: AnalyticsTicketTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredTickets = tickets.filter(t =>
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    const paginatedTickets = filteredTickets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const calculateDuration = (start?: string, end?: string) => {
        if (!start || !end) return '-';
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const mins = Math.floor(diff / 60000);
        return `${mins} min`;
    };

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
            {/* Header / Toolbar */}
            <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10">
                        <Truck size={18} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 leading-none mb-1">Registre des Flux</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Listing détaillé des camions complétés</p>
                    </div>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="RECHERCHER UN TICKET, PLAQUE..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-11 bg-white border-slate-100 rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto overflow-y-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">N° Ticket</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Véhicule / Chauffeur</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Catégorie</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Arrivée</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Heure Fin</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Durée</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paginatedTickets.map((ticket) => (
                            <tr key={ticket.ticketId} className="hover:bg-primary/[0.02] transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">#{ticket.ticketNumber}</span>
                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{ticket.site?.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-white group-hover:border-primary/20 transition-all">
                                            <Truck size={16} className="text-slate-500 group-hover:text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">{ticket.licensePlate || '---'}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{ticket.driverName || 'N/A'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-600 border border-slate-200">
                                        {ticket.category?.name || 'Inconnu'}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Calendar size={12} className="text-slate-300" />
                                        <span className="text-[11px] font-bold">{format(new Date(ticket.arrivedAt), 'HH:mm')}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <CheckCircle2 size={12} className="text-emerald-400" />
                                        <span className="text-[11px] font-bold">{ticket.completedAt ? format(new Date(ticket.completedAt), 'HH:mm') : '--:--'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-700">{calculateDuration(ticket.arrivedAt, ticket.completedAt)}</span>
                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Temps Total</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button 
                                        onClick={() => onViewDetails(ticket.ticketId)}
                                        className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center group/btn"
                                    >
                                        <Eye size={18} className="group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {paginatedTickets.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center bg-slate-50/50">
                        <div className="h-20 w-20 rounded-[2rem] bg-white shadow-inner flex items-center justify-center mb-6">
                            <Search className="h-10 w-10 text-slate-200" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Aucun résultat trouvé</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Affichage de <span className="text-slate-700">{Math.min(filteredTickets.length, itemsPerPage)}</span> sur <span className="text-slate-700">{filteredTickets.length}</span> tickets
                </p>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="rounded-xl h-10 w-10 p-0"
                    >
                        <ChevronLeft size={18} />
                    </Button>
                    <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            const pageNum = i + 1;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={cn(
                                        "h-10 w-10 rounded-xl text-xs font-black transition-all",
                                        currentPage === pageNum ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="rounded-xl h-10 w-10 p-0"
                    >
                        <ChevronRight size={18} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
