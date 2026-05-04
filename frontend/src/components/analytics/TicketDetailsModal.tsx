import { useQuery } from '@tanstack/react-query';
import { 
    X, 
    Clock, 
    Calendar, 
    User, 
    Truck, 
    Building2, 
    CheckCircle2, 
    ArrowRight,
    Loader2,
    Info,
    History as HistoryIcon,
    Weight,
    ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ticketApi } from '../../services/ticketApi';
import { cn } from '../../lib/utils';
import type { Ticket, TicketActionLog } from '../../types/ticket';

interface TicketDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId: string;
}

export default function TicketDetailsModal({ isOpen, onClose, ticketId }: TicketDetailsModalProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['ticketFullHistory', ticketId],
        queryFn: () => ticketApi.getTicketFullHistory(ticketId),
        enabled: isOpen && !!ticketId
    });

    if (!isOpen) return null;

    const ticket = data?.ticket;
    const history = data?.history || [];

    const calculateDuration = (start?: string, end?: string) => {
        if (!start || !end) return '-';
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const mins = Math.floor(diff / 60000);
        return `${mins} min`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-white/10 shadow-inner">
                            <Truck className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Détails du Ticket</h2>
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1 flex items-center gap-2">
                                <span className="text-white px-2 py-0.5 bg-white/10 rounded-full border border-white/10">#{ticket?.ticketNumber || '---'}</span>
                                • {ticket?.licensePlate || '---'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all hover:rotate-90">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4 bg-slate-50">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Chargement des données...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar">
                        <div className="p-8 space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <SummaryCard 
                                    icon={<Clock className="text-primary" />} 
                                    label="Heure Arrivée" 
                                    value={ticket?.arrivedAt ? format(new Date(ticket.arrivedAt), 'HH:mm:ss') : '--:--'}
                                    subValue={ticket?.arrivedAt ? format(new Date(ticket.arrivedAt), 'dd/MM/yyyy') : ''}
                                />
                                <SummaryCard 
                                    icon={<CheckCircle2 className="text-emerald-500" />} 
                                    label="Heure Fin" 
                                    value={ticket?.completedAt ? format(new Date(ticket.completedAt), 'HH:mm:ss') : '--:--'}
                                    subValue={ticket?.completedAt ? format(new Date(ticket.completedAt), 'dd/MM/yyyy') : ''}
                                />
                                <SummaryCard 
                                    icon={<Info className="text-sky-500" />} 
                                    label="Traitement" 
                                    value={calculateDuration(ticket?.startedAt, ticket?.completedAt)}
                                    subValue="Temps d'opération"
                                />
                                <SummaryCard 
                                    icon={<HistoryIcon className="text-amber-500" />} 
                                    label="Temps Total" 
                                    value={calculateDuration(ticket?.arrivedAt, ticket?.completedAt)}
                                    subValue="Présence sur site"
                                />
                            </div>

                            <div className="grid md:grid-cols-3 gap-8">
                                {/* Left Column: Info Sections */}
                                <div className="md:col-span-2 space-y-8">
                                    {/* Identification */}
                                    <Section title="Informations de Base" icon={<User className="h-4 w-4" />}>
                                        <div className="grid grid-cols-2 gap-6">
                                            <DataField label="Chauffeur" value={ticket?.driverName} />
                                            <DataField label="Société" value={ticket?.companyName} />
                                            <DataField label="Téléphone" value={ticket?.driverPhone} />
                                            <DataField label="N° Commande" value={ticket?.orderNumber} />
                                            <DataField label="Catégorie" value={ticket?.category?.name} highlight />
                                            <DataField label="Site" value={ticket?.site?.name} />
                                        </div>
                                    </Section>

                                    {/* Weights if available */}
                                    {(ticket?.weightIn || ticket?.weightOut) && (
                                        <Section title="Données de Pesée" icon={<Weight className="h-4 w-4" />}>
                                            <div className="grid grid-cols-3 gap-6">
                                                <DataField label="Poids Entrée" value={ticket?.weightIn ? `${ticket.weightIn} kg` : '-'} />
                                                <DataField label="Poids Sortie" value={ticket?.weightOut ? `${ticket.weightOut} kg` : '-'} />
                                                <DataField label="Poids Net" value={ticket?.weightIn && ticket?.weightOut ? `${Math.abs(ticket.weightOut - ticket.weightIn)} kg` : '-'} highlight />
                                            </div>
                                        </Section>
                                    )}

                                    {/* Action History / Timeline */}
                                    <Section title="Timeline des Actions" icon={<ClipboardList className="h-4 w-4" />}>
                                        <div className="space-y-4">
                                            {history.map((log: TicketActionLog, idx: number) => (
                                                <TimelineItem 
                                                    key={log.logId} 
                                                    log={log} 
                                                    isLast={idx === history.length - 1} 
                                                />
                                            ))}
                                        </div>
                                    </Section>
                                </div>

                                {/* Right Column: Details & Extras */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Building2 size={14} className="text-primary" /> Détails Opérationnels
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rappels</span>
                                                <span className="font-black text-slate-900">{ticket?.recallCount || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priorité</span>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                    ticket?.priority === 2 ? "bg-red-100 text-red-600" : 
                                                    ticket?.priority === 1 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {ticket?.priority === 2 ? 'Critique' : ticket?.priority === 1 ? 'Urgent' : 'Normal'}
                                                </span>
                                            </div>
                                            {ticket?.isTransferred && (
                                                <div className="flex justify-between items-center py-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transféré</span>
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">OUI</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">ID Système</p>
                                        <p className="text-[10px] font-mono break-all text-slate-500 bg-white/50 p-3 rounded-xl border border-primary/5">
                                            {ticket?.ticketId}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-100 flex justify-end shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-8 h-12 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string, subValue: string }) {
    return (
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                {icon}
            </div>
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                <p className="text-lg font-black text-slate-900 leading-none mb-1">{value}</p>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{subValue}</p>
            </div>
        </div>
    );
}

function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2">
                <span className="p-1.5 bg-white rounded-lg border border-slate-100 text-primary">{icon}</span>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">{title}</h3>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}

function DataField({ label, value, highlight }: { label: string, value?: string, highlight?: boolean }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className={cn(
                "text-sm font-black uppercase",
                highlight ? "text-primary bg-primary/5 px-2 py-0.5 rounded-lg w-fit border border-primary/10" : "text-slate-800"
            )}>
                {value || '---'}
            </p>
        </div>
    );
}

function TimelineItem({ log, isLast }: { log: TicketActionLog, isLast: boolean }) {
    const actionColors: Record<string, string> = {
        'APPEL': 'bg-amber-500',
        'TERMINER': 'bg-emerald-500',
        'COMMENCER': 'bg-primary',
        'TRANSFERE': 'bg-sky-500',
        'IMPRESSION': 'bg-indigo-500',
        'ANNULER': 'bg-red-500'
    };

    return (
        <div className="relative flex gap-4">
            {!isLast && <div className="absolute left-[11px] top-6 w-[2px] h-full bg-slate-100" />}
            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm", actionColors[log.actionType] || 'bg-slate-400')}>
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            <div className="pb-6 w-full">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-black uppercase tracking-tight text-slate-800">
                        {log.actionType}
                        {log.step && <span className="ml-2 text-slate-400 font-bold tracking-widest">({log.step.name})</span>}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-2 rounded-full">
                        {format(new Date(log.occurredAt), 'HH:mm:ss')}
                    </span>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white border border-slate-100 flex items-center justify-center">
                            <User size={12} className="text-slate-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-600">{log.agent?.username || 'Système'}</p>
                            <p className="text-[9px] text-slate-400 font-bold">{log.agent?.firstName} {log.agent?.lastName}</p>
                        </div>
                    </div>
                    {log.formData && Object.keys(log.formData).length > 0 && (
                        <div className="flex gap-2">
                             {Object.entries(log.formData).map(([key, val]) => (
                                 <span key={key} className="text-[9px] font-black uppercase bg-white border border-slate-100 px-2 py-0.5 rounded-lg text-slate-500">
                                     {key}: {String(val)}
                                 </span>
                             ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
