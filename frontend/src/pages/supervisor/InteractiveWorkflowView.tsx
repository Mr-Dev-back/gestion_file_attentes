import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ticketApi } from '../../services/ticketApi';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { Search, Loader2, MapPin, Truck, AlertCircle, Clock } from 'lucide-react';

const priorityColors: Record<string, string> = {
    'CRITIQUE': 'bg-red-100 text-red-600 border-red-300 ring-red-400',
    'URGENT': 'bg-orange-100 text-orange-600 border-orange-300 ring-orange-400',
    'NORMAL': 'bg-white text-slate-700 border-slate-200 ring-slate-300',
};

const statusColors: Record<string, string> = {
    'EN_ATTENTE': 'bg-yellow-400',
    'CALLING': 'bg-blue-400 animate-pulse',
    'PROCESSING': 'bg-emerald-400',
    'ISOLE': 'bg-red-500',
};

export default function InteractiveWorkflowView() {
    const { user } = useAuthStore();
    const siteId = user?.siteId;

    const [searchTerm, setSearchTerm] = useState('');

    // --- Hooks Data ---
    const { data: siteObj } = useQuery({
        queryKey: ['site', siteId],
        queryFn: async () => {
            // Need the full site object for workflowId
            const { data } = await api.get('/sites');
            return data.find((s: any) => s.siteId === siteId);
        },
        enabled: !!siteId
    });

    const workflowId = siteObj?.workflowId;

    const { data: workflows, isLoading: isWfLoading } = useQuery({
        queryKey: ['workflows'],
        queryFn: async () => {
            const { data } = await api.get('/workflows');
            return data;
        }
    });

    const { data: tickets = [], isLoading: isTicketsLoading, refetch } = useQuery({
        queryKey: ['tickets', 'site', siteId],
        queryFn: () => ticketApi.getTickets({ 
            siteId, 
            status: ['EN_ATTENTE', 'CALLING', 'PROCESSING', 'ISOLE'] 
        }),
        enabled: !!siteId,
        refetchInterval: 15000
    });

    // Sockets pour temps réel
    useSocketEvent('ticket_created', () => refetch());
    useSocketEvent('ticket_updated', () => refetch());
    useSocketEvent('ticket_called', () => refetch());
    useSocketEvent('ticket_started', () => refetch());
    useSocketEvent('ticket_completed', () => refetch());
    useSocketEvent('ticket_priority_updated', () => refetch());

    const activeWorkflow = useMemo(() => {
        if (!workflows || !workflowId) return null;
        return workflows.find((w: any) => w.workflowId === workflowId);
    }, [workflows, workflowId]);

    const activeSteps = useMemo(() => {
        if (!activeWorkflow?.steps) return [];
        return activeWorkflow.steps
            .filter((s: any) => s.isActive)
            .sort((a: any, b: any) => a.orderNumber - b.orderNumber);
    }, [activeWorkflow]);

    // Grouping tickets by stepId
    const ticketsByStep = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        activeSteps.forEach((s: any) => { grouped[s.stepId] = []; });

        tickets.forEach((ticket: any) => {
            if (ticket.currentStepId && grouped[ticket.currentStepId]) {
                grouped[ticket.currentStepId].push(ticket);
            }
        });

        // Filter by searchTerm and sort heavily via priority
        Object.keys(grouped).forEach(k => {
            grouped[k] = grouped[k].filter((t: any) => {
                if (!searchTerm.trim()) return true;
                const search = searchTerm.toLowerCase();
                return t.ticketNumber.toLowerCase().includes(search) ||
                       t.vehicleInfo?.licensePlate?.toLowerCase().includes(search) ||
                       t.driverName?.toLowerCase().includes(search);
            }).sort((a: any, b: any) => {
                const pMap: Record<string, number> = { 'CRITIQUE': 3, 'URGENT': 2, 'NORMAL': 1 };
                const pA = pMap[a.priority] || 0;
                const pB = pMap[b.priority] || 0;
                if (pB !== pA) return pB - pA;
                return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime();
            });
        });

        return grouped;
    }, [tickets, activeSteps, searchTerm]);

    const isLoading = isWfLoading || isTicketsLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
                <p className="text-text-muted font-bold animate-pulse">Chargement du Synoptique...</p>
            </div>
        );
    }

    if (!siteId) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <AlertCircle className="h-16 w-16 text-text-muted opacity-50 mb-4" />
                <h2 className="text-xl font-bold text-text-main">Aucun site associé</h2>
            </div>
        );
    }

    if (!activeWorkflow || activeSteps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <MapPin className="h-16 w-16 text-text-muted opacity-50 mb-4" />
                <h2 className="text-xl font-bold text-text-main">Aucun workflow actif sur ce site</h2>
                <p className="text-text-muted mt-2">Veuillez configurer un workflow pour le site actuel.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/30 rounded-3xl p-2 pb-[100px]">
            {/* Search Bar - Search & Track */}
            <div className="mb-8 px-4 mt-2">
                <div className="relative group max-w-2xl mx-auto">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher une plaque ou un N° de ticket pour le localiser..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-16 pr-6 py-5 bg-white border-2 rounded-2xl text-lg font-black outline-none transition-all shadow-xl
                            ${searchTerm 
                                ? 'border-primary/50 shadow-primary/10 ring-4 ring-primary/5' 
                                : 'border-transparent focus:border-primary/20 hover:border-slate-200'}`}
                    />
                    {searchTerm && (
                        <div className="absolute top-full left-0 right-0 mt-2 text-center text-sm font-bold text-primary animate-fade-in">
                            Mode Focus Activé : Les véhicules ne correspondant pas sont masqués.
                        </div>
                    )}
                </div>
            </div>

            {/* Pipeline CSS Grid View */}
            <div 
                className="grid gap-6 px-4"
                style={{ gridTemplateColumns: `repeat(${activeSteps.length}, minmax(320px, 1fr))` }}
            >
                {activeSteps.map((step: any, index: number) => {
                    const stepTickets = ticketsByStep[step.stepId] || [];
                    const count = stepTickets.length;
                    
                    return (
                        <div key={step.stepId} className="flex flex-col h-full bg-slate-100/50 rounded-[2rem] border border-slate-200/60 shadow-inner overflow-hidden relative">
                            {/* Étape Header */}
                            <div className="bg-white p-5 border-b border-slate-200/50 relative z-10 flex flex-col items-center shadow-sm">
                                <div className="absolute top-0 inset-x-0 outline outline-4 outline-slate-100" />
                                <div className="absolute top-4 left-4 h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                    {index + 1}
                                </div>
                                
                                <h3 className="text-lg font-black text-slate-700 tracking-tight mt-1">{step.name}</h3>
                                
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="px-5 py-1.5 bg-slate-100 text-slate-600 font-black rounded-full border border-slate-200 shadow-sm text-sm inline-flex items-center gap-2">
                                        <Truck className="h-3 w-3" />
                                        {count} camion{count > 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Étape Form/Tickets */}
                            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                                {stepTickets.map((ticket: any) => {
                                    const isHighlighted = searchTerm.length > 0;
                                    const colorTheme = priorityColors[ticket.priority] || priorityColors['NORMAL'];
                                    
                                    return (
                                        <div 
                                            key={ticket.ticketId}
                                            className={`
                                                relative p-4 rounded-2xl border transition-all duration-300 shadow-sm
                                                bg-white group cursor-default
                                                ${isHighlighted ? 'ring-4 ring-primary/40 shadow-xl' : 'hover:-translate-y-1 hover:shadow-md'}
                                                ${colorTheme}
                                            `}
                                        >
                                            {/* Status Dot */}
                                            <div 
                                                className={`absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow-sm ${statusColors[ticket.status] || 'bg-slate-300'}`}
                                                title={ticket.status}
                                            />

                                            <div className="flex justify-between items-start mb-2 pr-4 text-slate-700">
                                                <span className="font-black text-xl tracking-tighter">
                                                    #{ticket.ticketNumber.split('-').pop()}
                                                </span>
                                                <span className="text-[10px] uppercase font-black px-2 py-1 rounded-md bg-white/60 border border-current shadow-inner">
                                                    {ticket.priority}
                                                </span>
                                            </div>

                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-2.5 text-xs font-bold bg-black/5 p-2 rounded-xl text-slate-700">
                                                    <Truck className="h-4 w-4 opacity-70" />
                                                    <span className="tracking-tight">{ticket.vehicleInfo?.licensePlate || "INCONNU"}</span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {ticket.status === 'PROCESSING' ? (
                                                        <span className="text-emerald-600">EN TRAITEMENT</span>
                                                    ) : (
                                                        <span>
                                                            ~ {ticket.estimatedWaitTime || 0} min d'attente
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {stepTickets.length === 0 && (
                                    <div className="h-full min-h-[150px] flex flex-col items-center justify-center opacity-40 grayscale py-10">
                                        <Truck className="h-10 w-10 mb-3" />
                                        <p className="font-black text-[10px] uppercase tracking-widest">Zone Libre</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0, 0.1); border-radius: 10px; }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
}
