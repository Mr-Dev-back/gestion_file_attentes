import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { useKiosks, type Kiosk } from '../../hooks/useKiosks';
import { useSites, type Site } from '../../hooks/useSites';
import { useQueues, type Queue } from '../../hooks/useQueues';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Card, CardContent } from '../molecules/ui/card';
import { Badge } from '../atoms/ui/badge';
import { printTicket } from '../../utils/printTicket';
import { 
    Loader2, 
    Plus, 
    Edit2, 
    Trash2, 
    Monitor, 
    WifiOff, 
    Settings, 
    Smartphone, 
    Printer, 
    Palette,
    Info,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { Modal, ConfirmModal } from '../molecules/ui/modal';
import { toast } from '../molecules/ui/toast';
import { cn } from '../../lib/utils';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActionsToolbar } from '../molecules/BulkActionsToolbar';
import { AdminSkeleton } from '../molecules/ui/admin-skeleton';
import { EmptyState } from '../molecules/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../molecules/ui/tabs';

const KioskStatusBadge = ({ status }: { status: Kiosk['status'] }) => {
    switch (status) {
        case 'ONLINE': return <Badge className="bg-success text-white">En ligne</Badge>;
        case 'OFFLINE': return <Badge variant="secondary"><WifiOff className="h-3 w-3 mr-1" />Hors ligne</Badge>;
        case 'MAINTENANCE': return <Badge className="bg-warning text-black">Maintenance</Badge>;
        case 'PAPER_EMPTY': return <Badge className="bg-destructive text-white">Papier vide</Badge>;
        case 'ERROR': return <Badge className="bg-destructive text-white">Erreur</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

const DEFAULT_CONFIG = {
    welcomeMessage: "Bienvenue sur GesParc SIBM",
    primaryColor: "#3B82F6",
    logoUrl: null,
    showWeather: true,
    language: "fr"
};

const DEFAULT_CAPABILITIES = {
    hasPrinter: true,
    hasScale: false
};

export const KioskManager = () => {
    const { kiosks, isLoading, createKiosk, updateKiosk, deleteKiosk, bulkDeleteKiosks, bulkUpdateKiosksStatus } = useKiosks();
    const { sites } = useSites();
    const { queues } = useQueues();
    const queryClient = useQueryClient();

    // Real-time updates
    useSocketEvent('kiosk-update', () => {
        queryClient.invalidateQueries({ queryKey: ['kiosks'] });
    });

    const [selectedKiosk, setSelectedKiosk] = useState<Kiosk | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    
    const [form, setForm] = useState<Partial<Kiosk>>({ 
        name: '', 
        type: 'ENTRANCE', 
        status: 'OFFLINE', 
        siteId: '', 
        queueId: '',
        config: { ...DEFAULT_CONFIG },
        capabilities: { ...DEFAULT_CAPABILITIES }
    });

    const {
        selectedIds,
        selectedCount,
        isAllSelected,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected
    } = useBulkSelection(kiosks.map(k => k.kioskId));

    const handleOpenModal = (kiosk: Kiosk | null = null) => {
        if (kiosk) {
            setForm({
                name: kiosk.name,
                type: kiosk.type,
                status: kiosk.status,
                siteId: kiosk.siteId,
                queueId: kiosk.queues?.[0]?.queueId || '',
                ipAddress: kiosk.ipAddress || '',
                config: kiosk.config || { ...DEFAULT_CONFIG },
                capabilities: kiosk.capabilities || { ...DEFAULT_CAPABILITIES }
            });
            setSelectedKiosk(kiosk);
        } else {
            setForm({ 
                name: '', 
                type: 'ENTRANCE', 
                status: 'OFFLINE', 
                siteId: '', 
                queueId: '', 
                ipAddress: '',
                config: { ...DEFAULT_CONFIG },
                capabilities: { ...DEFAULT_CAPABILITIES }
            });
            setSelectedKiosk(null);
        }
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const closeConfirm = () => setConfirmState(prev => ({ ...prev, isOpen: false }));

    const handleSave = () => {
        const payload = { ...form };
        if (!payload.queueId) delete payload.queueId;
        if (!payload.ipAddress) delete payload.ipAddress;

        if (selectedKiosk) {
            updateKiosk.mutate({ id: selectedKiosk.kioskId, data: payload }, {
                onSuccess: () => {
                    setIsModalOpen(false);
                },
                onError: () => toast('Erreur lors de la mise à jour', 'error')
            });
        } else {
            createKiosk.mutate(payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                },
                onError: () => toast('Erreur lors de la création', 'error')
            });
        }
    };

    const handleBulkDelete = () => {
        setConfirmState({
            isOpen: true,
            title: 'Suppression groupée',
            message: `Voulez-vous vraiment supprimer les ${selectedCount} bornes sélectionnées ?`,
            onConfirm: async () => {
                try {
                    await bulkDeleteKiosks.mutateAsync(selectedIds);
                    clearSelection();
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const handleBulkStatusChange = (status: string) => {
        bulkUpdateKiosksStatus.mutate({ ids: selectedIds, status }, {
            onSuccess: () => clearSelection()
        });
    };

    const filteredQueues = queues ? queues.filter(q => q.siteId === form.siteId) : [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="w-64 h-8 bg-slate-200/50 animate-pulse rounded-lg" />
                    <div className="w-32 h-8 bg-slate-200/50 animate-pulse rounded-lg" />
                </div>
                <AdminSkeleton variant="card" count={6} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-black flex items-center gap-3">
                        <Monitor className="h-6 w-6 text-primary" /> 
                        Gestion des Bornes
                    </h3>
                    {kiosks.length > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={toggleSelectAll}
                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl border border-primary/10"
                        >
                            {isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
                        </Button>
                    )}
                </div>
                <Button size="sm" onClick={() => handleOpenModal()} className="rounded-xl shadow-lg shadow-primary/20"><Plus className="h-4 w-4 mr-2" /> Nouvelle Borne</Button>
            </div>

            {kiosks.length === 0 ? (
                <EmptyState
                    icon={Monitor}
                    title="Aucune borne trouvée"
                    description="Configurez les bornes d'entrée et d'information pour vos sites."
                    actionLabel="Nouvelle Borne"
                    onAction={() => handleOpenModal()}
                />
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kiosks.map(kiosk => (
                        <Card 
                            key={kiosk.kioskId} 
                            className={cn(
                                "border-border/50 transition-all relative group overflow-hidden",
                                isSelected(kiosk.kioskId) ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "hover:border-primary/20 hover:shadow-md"
                            )}
                        >
                            <div className="absolute top-3 right-3 z-20">
                                <input 
                                    type="checkbox" 
                                    checked={isSelected(kiosk.kioskId)} 
                                    onChange={() => toggleSelect(kiosk.kioskId)}
                                    className={cn(
                                        "h-6 w-6 rounded-md border-primary/30 accent-primary cursor-pointer transition-all shadow-md",
                                        isSelected(kiosk.kioskId) ? "opacity-100 scale-110" : "opacity-40 hover:opacity-100"
                                    )}
                                />
                            </div>
                            
                            {/* Visual Indicator of Color */}
                            <div 
                                className="h-1.5 w-full absolute top-0 left-0" 
                                style={{ backgroundColor: kiosk.config?.primaryColor || DEFAULT_CONFIG.primaryColor }} 
                            />

                            <CardContent className="p-4 flex flex-col gap-3 pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Monitor className="h-4 w-4 text-primary" />
                                            <h4 className="font-bold">{kiosk.name}</h4>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">{kiosk.type}</span>
                                    </div>
                                    <KioskStatusBadge status={kiosk.status} />
                                </div>

                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between border-b border-border/10 pb-1">
                                        <span className="text-text-muted">Site</span>
                                        <span className="font-medium">{kiosk.site?.name || '?'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-border/10 pb-1">
                                        <span className="text-text-muted">Matériel</span>
                                        <div className="flex gap-2">
                                            {kiosk.capabilities?.hasPrinter && (
                                                <span title="Imprimante OK">
                                                    <Printer className="h-3.5 w-3.5 text-success" />
                                                </span>
                                            )}
                                            <Smartphone className="h-3.5 w-3.5 text-text-muted" />
                                        </div>
                                    </div>
                                    {kiosk.ipAddress && (
                                        <div className="flex justify-between pt-1">
                                            <span className="text-text-muted">IP</span>
                                            <span className="font-mono text-[10px] bg-slate-100 px-1.5 rounded">{kiosk.ipAddress}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-border/10 mt-auto">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 rounded-lg text-slate-400 hover:text-primary transition-all" 
                                        title="Tester l'impression"
                                        onClick={() => printTicket({
                                            ticketNumber: 'TEST-001',
                                            licensePlate: 'TEST-PL',
                                            driverName: 'TEST CHAUFFEUR',
                                            companyName: 'SOCIETE TEST',
                                            arrivedAt: new Date(),
                                            status: 'EN_ATTENTE',
                                            site: { name: kiosk.site?.name || 'SITE TEST' }
                                        })}
                                    >
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => handleOpenModal(kiosk)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                    <Button size="sm" variant="ghost" className="h-8 text-danger rounded-lg" onClick={() => {
                                        setConfirmState({
                                            isOpen: true,
                                            title: 'Supprimer la borne',
                                            message: `Voulez-vous vraiment supprimer la borne "${kiosk.name}" ?`,
                                            onConfirm: () => deleteKiosk.mutate(kiosk.kioskId)
                                        });
                                    }}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={selectedKiosk ? `Configurer : ${selectedKiosk.name}` : "Nouvelle Borne Terrain"}
                size="2xl"
            >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="general" className="gap-2"><Settings className="h-4 w-4" /> Général</TabsTrigger>
                        <TabsTrigger value="hardware" className="gap-2"><Printer className="h-4 w-4" /> Matériel</TabsTrigger>
                        <TabsTrigger value="interface" className="gap-2"><Palette className="h-4 w-4" /> Interface UI</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 animate-in fade-in slide-in-from-left-4">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase text-text-muted">Nom de la borne</label>
                                <Input placeholder="ex: Borne Entrée Principal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-text-muted mb-1 block">Type d'usage</label>
                                    <select className="w-full p-2 border rounded-xl bg-white" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                                        <option value="ENTRANCE">Enregistrement Entrée</option>
                                        <option value="INFO">Consultation Info</option>
                                        <option value="WEIGHING_BRIDGE">Pont Bascule</option>
                                        <option value="EXIT">Validation Sortie</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-text-muted mb-1 block">État Initial</label>
                                    <select className="w-full p-2 border rounded-xl bg-white" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                                        <option value="ONLINE">En service (Online)</option>
                                        <option value="OFFLINE">Hors service (Offline)</option>
                                        <option value="MAINTENANCE">Maintenance</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase text-text-muted">Adresse Réseau (IP)</label>
                                <Input placeholder="192.168.1.X" value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-text-muted mb-1 block">Site de Rattachement</label>
                                    <select className="w-full p-2 border rounded-xl bg-white" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value, queueId: '' })}>
                                        <option value="">-- Sélectionner un Site --</option>
                                        {sites.map((site: Site) => <option key={site.siteId} value={site.siteId}>{site.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-text-muted mb-1 block">File par défaut</label>
                                    <select className="w-full p-2 border rounded-xl bg-white" value={form.queueId} disabled={!form.siteId} onChange={(e) => setForm({ ...form, queueId: e.target.value })}>
                                        <option value="">-- Aucune --</option>
                                        {filteredQueues.map((queue: Queue) => <option key={queue.queueId} value={queue.queueId}>{queue.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="hardware" className="space-y-6 animate-in fade-in slide-in-from-left-4">
                        <div className="grid gap-6">
                            <Card className="border-border/30 bg-surface/30">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Printer className="h-5 w-5" /></div>
                                        <div>
                                            <p className="font-bold">Imprimante Thermique</p>
                                            <p className="text-xs text-text-muted">Permet l'impression automatique des tickets SRA.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setForm({ ...form, capabilities: { ...form.capabilities, hasPrinter: !form.capabilities?.hasPrinter } })}
                                        className={cn("h-6 w-12 rounded-full transition-colors relative", form.capabilities?.hasPrinter ? "bg-success" : "bg-slate-300")}
                                    >
                                        <div className={cn("absolute top-1 h-4 w-4 bg-white rounded-full transition-all", form.capabilities?.hasPrinter ? "left-7" : "left-1")} />
                                    </button>
                                </CardContent>
                            </Card>

                            <Card className="border-border/30 bg-surface/30">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><Monitor className="h-5 w-5" /></div>
                                        <div>
                                            <p className="font-bold">Intégration Pont Bascule</p>
                                            <p className="text-xs text-text-muted">Récupération automatique du poids brut/tare.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setForm({ ...form, capabilities: { ...form.capabilities, hasScale: !form.capabilities?.hasScale } })}
                                        className={cn("h-6 w-12 rounded-full transition-colors relative", form.capabilities?.hasScale ? "bg-success" : "bg-slate-300")}
                                    >
                                        <div className={cn("absolute top-1 h-4 w-4 bg-white rounded-full transition-all", form.capabilities?.hasScale ? "left-7" : "left-1")} />
                                    </button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="interface" className="space-y-4 animate-in fade-in slide-in-from-left-4">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase text-text-muted">Message de Bienvenue</label>
                                <Input 
                                    placeholder="ex: Bienvenue chez SIBM" 
                                    value={form.config?.welcomeMessage} 
                                    onChange={(e) => setForm({ ...form, config: { ...form.config, welcomeMessage: e.target.value } as any })} 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold uppercase text-text-muted">Couleur de l'interface</label>
                                    <div className="flex gap-2">
                                        <Input 
                                            type="color" 
                                            className="w-12 h-10 p-1 cursor-pointer"
                                            value={form.config?.primaryColor} 
                                            onChange={(e) => setForm({ ...form, config: { ...form.config, primaryColor: e.target.value } as any })} 
                                        />
                                        <Input 
                                            placeholder="#000000" 
                                            value={form.config?.primaryColor} 
                                            onChange={(e) => setForm({ ...form, config: { ...form.config, primaryColor: e.target.value } as any })} 
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold uppercase text-text-muted">Langue</label>
                                    <select 
                                        className="w-full p-2 border rounded-xl bg-white" 
                                        value={form.config?.language} 
                                        onChange={(e) => setForm({ ...form, config: { ...form.config, language: e.target.value } as any })}
                                    >
                                        <option value="fr">Français</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                            </div>

                            <Card className="border-border/30 bg-surface/30">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-info/10 rounded-lg text-info"><Info className="h-5 w-5" /></div>
                                        <div>
                                            <p className="font-bold">Afficher la Météo</p>
                                            <p className="text-xs text-text-muted">Affiche les conditions locales sur l'accueil.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setForm({ ...form, config: { ...form.config, showWeather: !form.config?.showWeather } as any })}
                                        className={cn("h-6 w-12 rounded-full transition-colors relative", form.config?.showWeather ? "bg-success" : "bg-slate-300")}
                                    >
                                        <div className={cn("absolute top-1 h-4 w-4 bg-white rounded-full transition-all", form.config?.showWeather ? "left-7" : "left-1")} />
                                    </button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border/10">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl px-6">Annuler</Button>
                    <Button onClick={handleSave} className="rounded-xl px-8 shadow-lg shadow-primary/20">
                        {selectedKiosk ? 'Mettre à jour' : 'Créer la Borne'}
                    </Button>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                variant="danger"
            />

            <BulkActionsToolbar 
                selectedCount={selectedCount}
                onDelete={handleBulkDelete}
                onActivate={() => handleBulkStatusChange('ONLINE')}
                onDeactivate={() => handleBulkStatusChange('OFFLINE')}
                onClear={clearSelection}
                isLoading={bulkDeleteKiosks.isPending || bulkUpdateKiosksStatus.isPending}
                label="bornes sélectionnées"
            />
        </div>
    );
};

