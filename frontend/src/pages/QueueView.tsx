import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSupervisorQueues, useSites } from '../hooks/useDashboardStats';
import { useSocket, useSocketEvent } from '../hooks/useSocketEvent';
import { useTicketActions } from '../hooks/useTicketActions';
import { ConnectionStatus } from '../components/atoms/ui/ConnectionStatus';
import { Card } from '../components/molecules/ui/card';
import { Badge } from '../components/atoms/ui/badge';
import { Modal } from '../components/molecules/ui/modal';
import { Button } from '../components/atoms/ui/button';
import { Truck, Activity, List, Loader2, Edit2, AlertCircle, MapPin, Search, ChevronDown, Rocket, Tag } from 'lucide-react';
import type { SupervisorQueueResponse } from '../types/dashboard';

export default function QueueView() {
    const { user, hasRole } = useAuthStore();
    const { state: socketState } = useSocket();
    
    // Site selection state
    const [selectedSiteId, setSelectedSiteId] = useState<string>(user?.siteId || '');
    const { data: sites } = useSites();
    const isManagerOrAdmin = hasRole(['MANAGER', 'ADMINISTRATOR']);

    const { data: queues, isLoading, refetch } = useSupervisorQueues(selectedSiteId);
    const { updatePriority } = useTicketActions();
    const priorityMap: Record<string, number> = {
        NORMAL: 0,
        URGENT: 1,
        CRITIQUE: 2
    };

    const [selectedTicket, setSelectedTicket] = useState<{ id: string, number: string, currentPriority: string } | null>(null);
    const [newPriority, setNewPriority] = useState<string>('NORMAL');
    const [justification, setJustification] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Real-time updates
    useSocketEvent('ticket_updated', () => refetch());
    useSocketEvent('ticket_created', () => refetch());
    useSocketEvent('queue_updated', () => refetch());
    useSocketEvent('ticket_priority_updated', () => refetch());

    const handleUpdatePriority = async (ticketId?: string, priority?: string, reason?: string) => {
        const tId = ticketId || selectedTicket?.id;
        const p = priority || newPriority;
        const r = reason || justification || 'Mise à jour rapide superviseur';

        if (!tId) return;

        try {
            await updatePriority.mutateAsync({
                ticketId: tId,
                priority: priorityMap[p] ?? 0,
                reason: r
            });
            setSelectedTicket(null);
            setJustification('');
        } catch {
            // Error is handled by the hook
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
                <p className="text-text-muted font-bold animate-pulse">Chargement des files d'attente...</p>
            </div>
        );
    }

    const priorityColors: Record<string, string> = {
        'CRITIQUE': 'bg-red-100 text-red-600 border-red-200',
        'URGENT': 'bg-orange-100 text-orange-600 border-orange-200',
        'NORMAL': 'bg-green-100 text-green-600 border-green-200',
    };

    return (
        <div className="p-6 space-y-8 animate-fade-in pb-20">
            {/* Header / Site Selector */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] shadow-sm border border-white/20">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary transform -rotate-2">
                        <List className="h-8 w-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-text-main tracking-tighter">
                                Supervision des Files
                            </h1>
                            <ConnectionStatus state={socketState} />
                        </div>
                        <p className="text-[10px] font-black uppercase text-text-muted tracking-widest ml-1">
                            État en temps réel des sites SIBM
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher ticket ou plaque..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-3 bg-white/60 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-bold w-64 outline-none transition-all shadow-sm"
                        />
                    </div>

                    {/* Site Selector for Managers/Admins */}
                    {isManagerOrAdmin && (
                        <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                            <select
                                value={selectedSiteId}
                                onChange={(e) => setSelectedSiteId(e.target.value)}
                                className="pl-11 pr-10 py-3 bg-white border-2 border-primary/10 hover:border-primary/30 rounded-2xl text-sm font-black appearance-none outline-none transition-all shadow-md min-w-[200px] cursor-pointer"
                            >
                                <option value="">Tous les sites</option>
                                {sites?.map(site => (
                                    <option key={site.siteId} value={site.siteId}>
                                        {site.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none group-hover:text-primary transition-colors" />
                        </div>
                    )}
                </div>
            </div>

            {/* Queue Visualization */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {queues?.map((queue) => (
                    <Card key={queue.queueId} className="border-0 shadow-xl bg-white/60 backdrop-blur-xl rounded-[2rem] overflow-hidden border-white/20 flex flex-col h-[600px]">
                        <div className="p-6 bg-white/30 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-white/40">
                                    <Truck className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-black text-text-main leading-tight">{queue.name}</h3>
                                        {queue.category && (
                                            <Badge 
                                                style={{ backgroundColor: `${queue.category.color}20`, color: queue.category.color, borderColor: `${queue.category.color}40` }}
                                                className="text-[10px] border px-2 py-0.5"
                                            >
                                                <Tag className="h-3 w-3 mr-1" />
                                                {queue.category.name}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <MapPin className="h-3 w-3 text-primary animate-pulse" />
                                        <p className="text-[9px] font-black uppercase text-primary tracking-wider">{queue.siteName || 'SIBM'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {queue.tickets.some(t => t.priority === 'CRITIQUE') && (
                                    <div className="h-2 w-2 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_red]" title="Alerte Critique" />
                                )}
                                <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-black rounded-full border border-primary/10 shadow-sm">
                                    {queue.truckCount} camions
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {queue.tickets.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {queue.tickets
                                    .filter(t => 
                                        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        t.vehicleInfo?.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .sort((a, b) => {
                                        const pMap: Record<SupervisorQueueResponse['tickets'][number]['priority'], number> = { CRITIQUE: 3, URGENT: 2, NORMAL: 1 };
                                        const pA = pMap[a.priority] || 0;
                                        const pB = pMap[b.priority] || 0;
                                        if (pB !== pA) return pB - pA;
                                        return a.position - b.position;
                                    }).map((ticket) => (
                                        <div
                                            key={ticket.ticketId}
                                            className={`p-4 rounded-[1.5rem] border-2 transition-all hover:translate-y-[-4px] shadow-sm relative group ${priorityColors[ticket.priority] || 'bg-white border-white/60 shadow-md'}`}
                                        >
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                                                {ticket.priority !== 'URGENT' && ticket.priority !== 'CRITIQUE' && (
                                                    <button
                                                        onClick={() => handleUpdatePriority(ticket.ticketId, 'URGENT', 'Passé en Urgent par Supervision')}
                                                        className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-md transition-colors"
                                                        title="Passer en URGENT"
                                                    >
                                                        <Rocket className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setSelectedTicket({ id: ticket.ticketId, number: ticket.ticketNumber, currentPriority: ticket.priority });
                                                        setNewPriority(ticket.priority);
                                                    }}
                                                    className="p-2 bg-white/80 text-primary rounded-lg hover:bg-white shadow-md transition-colors border border-primary/10"
                                                    title="Modifier détails"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="flex justify-between items-start mb-3 pr-8">
                                                <span className="font-black text-2xl tracking-tighter">#{ticket.ticketNumber}</span>
                                                <div className="text-[10px] uppercase font-black px-2 py-1 rounded-lg bg-white/50 border border-current/20 shadow-inner">
                                                    Pos: {ticket.position}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs font-bold opacity-80 bg-white/30 p-2 rounded-xl border border-current/5">
                                                    <Truck className="h-3.5 w-3.5" />
                                                    <span className="tracking-tight">{ticket.vehicleInfo?.licensePlate || "PAS D'IMMATRICULATION"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold opacity-80 bg-white/30 p-2 rounded-xl border border-current/5">
                                                    <Activity className="h-3.5 w-3.5" />
                                                    <span>~ {ticket.estimatedWaitTime} MIN D'ATTENTE</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest">{ticket.status}</span>
                                                <div className={`w-2 h-2 rounded-full animate-pulse bg-current shadow-[0_0_8px_currentColor]`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 grayscale py-20">
                                    <Truck className="h-16 w-16 mb-4" />
                                    <p className="font-black uppercase tracking-widest text-sm">File Vide</p>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}

                {queues?.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white/40 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-white/60 shadow-inner">
                        <Truck className="h-20 w-20 mx-auto mb-6 text-text-muted opacity-20" />
                        <p className="text-text-muted font-black text-xl uppercase tracking-tighter">Aucune file d'attente configurée pour ce site.</p>
                    </div>
                )}
            </div>

            {/* Priority Modal */}
            <Modal
                isOpen={!!selectedTicket}
                onClose={() => setSelectedTicket(null)}
                title={`Modifier Priorité - #${selectedTicket?.number}`}
            >
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-text-muted">Niveau de Priorité</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['NORMAL', 'URGENT', 'CRITIQUE'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setNewPriority(p)}
                                    className={`py-3 px-2 rounded-xl text-[10px] font-black border-2 transition-all ${newPriority === p
                                            ? 'bg-primary border-primary text-white shadow-lg scale-105'
                                            : 'bg-surface border-border text-text-muted hover:border-primary/30'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-text-muted">
                            Justification {newPriority === 'CRITIQUE' && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            placeholder="Pourquoi ce changement ?"
                            className="w-full h-32 bg-white rounded-[1.5rem] border-2 border-border p-4 text-sm font-bold focus:border-primary focus:outline-none transition-all shadow-inner"
                        />
                        {newPriority === 'CRITIQUE' && (justification.trim().length < 5) && (
                            <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Minimum 5 caractères pour une priorité critique
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest"
                            onClick={() => setSelectedTicket(null)}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                            disabled={updatePriority.isPending || (newPriority === 'CRITIQUE' && justification.trim().length < 5)}
                            onClick={() => handleUpdatePriority()}
                        >
                            {updatePriority.isPending ? 'Mise à jour...' : 'Enregistrer'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(var(--primary-rgb), 0.1);
                    border-radius: 10px;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
