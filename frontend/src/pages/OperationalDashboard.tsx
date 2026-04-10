import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/molecules/ui/card';
import { Button } from '../components/atoms/ui/button';
import { Input } from '../components/atoms/ui/input';
import { Badge } from '../components/atoms/ui/badge';
import { cn } from '../lib/utils';
import { useTicketWorkflow } from '../hooks/useTicketWorkflow';
import { useQueues, type Queue } from '../hooks/useQueues';
import { useAuthStore } from '../stores/useAuthStore';
import { 
    Truck, 
    Play, 
    CheckCircle2, 
    Clock, 
    Package, 
    Search, 
    Megaphone,
    AlertCircle,
    User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DynamicForm } from '../components/molecules/ui/DynamicForm';
import type { Ticket, TicketFormData } from '../types/ticket';

interface OperationalDashboardProps {
    queueId?: string;
    title: string;
    description: string;
    icon?: React.ReactNode;
}

export default function OperationalDashboard({ queueId: initialQueueId, title, description, icon }: OperationalDashboardProps) {
    const { queues } = useQueues();
    const { user } = useAuthStore();
    const [selectedQueueId, setSelectedQueueId] = useState<string | undefined>(initialQueueId);

    useEffect(() => {
        // 1. Priorité à la file assignée à l'utilisateur pour l'isolation
        if (user?.assignedQueueId) {
            setSelectedQueueId(user.assignedQueueId);
            return;
        }

        if (queues && queues.length > 0 && !selectedQueueId) {
            const normalizedTitle = title.toLowerCase();
            const foundQueue = queues.find((q: Queue) =>
                q.name.toLowerCase().includes(normalizedTitle) ||
                (normalizedTitle.includes('bascule') && q.name.toLowerCase().includes('bascule')) ||
                (normalizedTitle.includes('chargement') && q.name.toLowerCase().includes('chargement'))
            );
            if (foundQueue) {
                queueMicrotask(() => {
                    setSelectedQueueId(foundQueue.queueId);
                });
            }
        }
    }, [queues, title, selectedQueueId, user?.assignedQueueId]);

    const { 
        tickets, 
        isLoading: storeLoading,
        callTicket,
        recallTicket,
        processTicket,
        completeStep,
        isolateTicket,
        isIsolating
    } = useTicketWorkflow(selectedQueueId);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    const ticketList = tickets || [];

    const filteredTickets = useMemo(() => {
        return ticketList.filter(t =>
            t.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [ticketList, searchTerm]);

    const waitingList = filteredTickets.filter(t => t.status === 'EN_ATTENTE' || t.status === 'CALLING' || t.status === 'ISOLE');
    const inProgressList = filteredTickets.filter(t => t.status === 'PROCESSING');

    const selectedTicket = useMemo(() => 
        ticketList.find(t => t.ticketId === selectedTicketId), 
    [ticketList, selectedTicketId]);

    const handleCall = (id: string) => callTicket({ ticketId: id, quaiId: selectedQueueId });
    const handleRecall = (id: string) => recallTicket(id);
    const handleStart = (id: string) => processTicket({ ticketId: id, quaiId: selectedQueueId });
    const handleIsolate = (id: string) => isolateTicket(id);

    const handleCompleteStep = (formData: TicketFormData) => {
        if (!selectedTicketId) return;
        completeStep(
            { ticketId: selectedTicketId, formData },
            {
                onSuccess: () => setSelectedTicketId(null)
            }
        );
    };

    const TicketCard = ({ ticket }: { ticket: Ticket }) => (
        <div
            className={cn(
                "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                selectedTicketId === ticket.ticketId 
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-md" 
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
                ticket.status === 'ISOLE' && "border-danger/30 bg-danger/5"
            )}
            onClick={() => setSelectedTicketId(ticket.ticketId)}
        >
            {ticket.status === 'ISOLE' && (
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-danger text-white text-[10px] font-black uppercase rounded-bl-lg flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Isolé
                </div>
            )}

            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105",
                        ticket.status === 'PROCESSING' ? "bg-warning text-white animate-pulse" : 
                        ticket.status === 'CALLING' ? "bg-primary text-white" : 
                        ticket.status === 'ISOLE' ? "bg-danger text-white" : "bg-slate-100 text-slate-500"
                    )}>
                        {ticket.status === 'PROCESSING' ? <Clock className="h-6 w-6" /> : 
                         ticket.status === 'CALLING' ? <Megaphone className="h-6 w-6" /> : 
                         ticket.status === 'ISOLE' ? <AlertCircle className="h-6 w-6" /> :
                         <Truck className="h-6 w-6" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xl text-slate-800 uppercase tracking-tighter">
                                {ticket.licensePlate || '---'}
                            </span>
                            <Badge variant="outline" className="text-[10px] h-5 border-slate-200 bg-slate-50 text-slate-500 font-bold">
                                {ticket.ticketNumber}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <User className="h-3 w-3 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500">{ticket.driverName || 'Chauffeur inconnu'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                        ticket.priority > 0 ? "bg-danger/10 text-danger" : "bg-slate-100 text-slate-500"
                    )}>
                        Priorité {ticket.priority}
                    </div>
                    {ticket.recallCount > 0 && (
                        <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 rounded border border-amber-100">
                            {ticket.recallCount} rappels
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(ticket.arrivedAt), { addSuffix: true, locale: fr })}
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {ticket.status === 'EN_ATTENTE' && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleCall(ticket.ticketId); }} className="h-8 rounded-lg">
                            <Megaphone className="h-3 w-3 mr-1" /> Appeler
                        </Button>
                    )}
                    {(ticket.status === 'CALLING' || ticket.status === 'ISOLE') && (
                        <>
                            <Button 
                                size="sm" 
                                variant={ticket.status === 'ISOLE' ? 'outline' : 'secondary'} 
                                onClick={(e) => { e.stopPropagation(); handleIsolate(ticket.ticketId); }} 
                                className={cn("h-8 rounded-lg", ticket.status === 'ISOLE' ? "border-danger text-danger hover:bg-danger/5" : "")}
                            >
                                <AlertCircle className="h-3 w-3 mr-1" /> {ticket.status === 'ISOLE' ? 'Sortir' : 'Isoler'}
                            </Button>
                            {ticket.status === 'CALLING' && (
                                <>
                                    <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleRecall(ticket.ticketId); }} className="h-8 rounded-lg">
                                        <Megaphone className="h-3 w-3 mr-1" /> Rappeler
                                    </Button>
                                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleStart(ticket.ticketId); }} className="h-8 rounded-lg bg-warning hover:bg-warning/90">
                                        <Play className="h-3 w-3 mr-1" /> Démarrer
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6 p-2">
            <div className="flex items-center justify-between shrink-0 px-2">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-primary">
                        {icon || <Package className="h-8 w-8" />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase italic">
                            {title}
                        </h2>
                        <p className="text-slate-500 text-sm font-medium">{description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-72 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Rechercher un ticket, une immatriculation..."
                            className="pl-10 h-11 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-primary/10 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="h-10 w-px bg-slate-200 mx-2" />
                    <Badge variant="secondary" className="h-11 px-4 rounded-xl bg-white border-slate-200 text-slate-600 font-bold text-sm shadow-sm">
                        {filteredTickets.length} au total
                    </Badge>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
                {/* File d'attente */}
                <Card className="lg:col-span-7 flex flex-col overflow-hidden h-full border-none shadow-xl bg-slate-100/50 rounded-[2rem]">
                    <CardHeader className="py-5 px-8 flex-row justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">File d'attente</CardTitle>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none font-black px-3 py-1 rounded-full">
                            {waitingList.length} TICKETS
                        </Badge>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
                        {waitingList.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-40 py-20">
                                <Truck className="h-20 w-20 mb-4 stroke-[1]" />
                                <p className="font-bold uppercase tracking-widest text-xs">Aucun ticket en attente</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-1 gap-4">
                                {waitingList.map(ticket => (
                                    <TicketCard key={ticket.ticketId} ticket={ticket} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Zone d'action dynamique */}
                <div className="lg:col-span-5 flex flex-col gap-6 h-full overflow-hidden">
                    {/* Tickets en cours */}
                    <Card className="shrink-0 flex flex-col border-none shadow-lg bg-warning/5 rounded-[2rem] border-2 border-warning/10">
                        <CardHeader className="py-4 px-8 flex-row justify-between items-center shrink-0 border-b border-warning/10">
                            <div className="flex items-center gap-2 text-warning-dark">
                                <Play className="h-4 w-4" />
                                <CardTitle className="text-xs font-black uppercase tracking-widest">En Cours de Traitement</CardTitle>
                            </div>
                            <Badge className="bg-warning text-white font-black">{inProgressList.length}</Badge>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3 max-h-[250px] overflow-y-auto">
                            {inProgressList.length === 0 ? (
                                <div className="text-center py-6 text-slate-400 italic text-xs font-medium">
                                    Aucun ticket en cours sur ce poste
                                </div>
                            ) : (
                                inProgressList.map(ticket => (
                                    <TicketCard key={ticket.ticketId} ticket={ticket} />
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Formulaire Dynamique */}
                    <Card className="flex-1 border-none shadow-2xl bg-white rounded-[2rem] overflow-hidden flex flex-col">
                        <CardHeader className="bg-slate-800 text-white py-5 px-8 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-6 w-6 text-primary-light" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">Actions de l'étape</CardTitle>
                                        <p className="text-[10px] text-white/50 font-bold uppercase mt-0.5 tracking-wider">
                                            {selectedTicket ? `Ticket: ${selectedTicket.ticketNumber}` : 'Veuillez sélectionner un ticket'}
                                        </p>
                                    </div>
                                </div>
                                {selectedTicket && (
                                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-mono font-black text-xs">
                                        {selectedTicket.currentStep?.order}
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                            {!selectedTicket ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center py-10">
                                    <div className="h-20 w-20 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center mb-4">
                                        <AlertCircle className="h-10 w-10" />
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-widest max-w-[200px]">
                                        Sélectionnez un ticket dans la liste pour agir
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Résumé Logistique Rapide */}
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Immatriculation</span>
                                            <span className="font-mono font-bold text-slate-700">{selectedTicket.licensePlate || '---'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commande</span>
                                            <span className="font-mono font-bold text-slate-700">{selectedTicket.orderNumber || '---'}</span>
                                        </div>
                                    </div>

                                    {/* Actions rapides */}
                                    <div className="flex gap-3">
                                        <Button 
                                            variant={selectedTicket.status === 'ISOLE' ? 'default' : 'outline'} 
                                            onClick={() => handleIsolate(selectedTicket.ticketId)} 
                                            className={cn(
                                                "flex-1 h-12 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-sm transition-all",
                                                selectedTicket.status === 'ISOLE' ? "bg-danger hover:bg-danger/90 text-white" : "border-danger text-danger hover:bg-danger/5"
                                            )}
                                            disabled={isIsolating}
                                        >
                                            <AlertCircle className="h-5 w-5" />
                                            {selectedTicket.status === 'ISOLE' ? "Sortir d'Isolation" : "Isoler le Ticket"}
                                        </Button>
                                    </div>

                                    {/* Formulaire de l'étape */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-1 w-8 bg-primary rounded-full" />
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">
                                                Configuration: {selectedTicket.currentStep?.queue?.name || 'Standard'}
                                            </h4>
                                        </div>
                                        
                                        <DynamicForm 
                                            config={selectedTicket.currentStep?.formConfig || []}
                                            onSubmit={handleCompleteStep}
                                            isLoading={storeLoading}
                                            initialData={selectedTicket}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
