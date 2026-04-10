import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useQueues, type Queue } from '../../hooks/useQueues';
import { useCategories } from '../../hooks/useCategories';
import { useWorkflows } from '../../hooks/useWorkflows';
import { useQuaiParameters } from '../../hooks/useQuaiParameters';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Card, CardContent } from '../molecules/ui/card';
import { Badge } from '../atoms/ui/badge';
import { Loader2, Plus, Edit2, ListOrdered, Info, Power, PowerOff, Tag, GitBranch, Monitor } from 'lucide-react';
import { Modal } from '../molecules/ui/modal';
import { toast } from '../molecules/ui/toast';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActionsToolbar } from '../molecules/BulkActionsToolbar';
import { AdminSkeleton } from '../molecules/ui/admin-skeleton';
import { EmptyState } from '../molecules/ui/empty-state';

export const QueueManager = () => {
    const { queues, isLoading: isLoadingQueues, createQueue, updateQueue, bulkUpdateQueueStatus } = useQueues();
    const { categories, isLoading: isLoadingCategories } = useCategories();
    const { workflows, isLoading: isLoadingWorkflows } = useWorkflows();
    const { parameters: quais, isLoading: isLoadingQuais } = useQuaiParameters();

    const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ 
        name: '', 
        description: '', 
        isActive: true, 
        categoryId: '',
        stepId: '',
        quaiId: ''
    });

    const {
        selectedIds,
        selectedCount,
        isAllSelected,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected
    } = useBulkSelection(queues.map(q => q.queueId));

    const handleOpenModal = (queue: Queue | null = null) => {
        if (queue) {
            setForm({
                name: queue.name,
                description: queue.description || '',
                isActive: queue.isActive,
                categoryId: queue.categoryId || '',
                stepId: queue.stepId || '',
                quaiId: queue.quaiId || ''
            });
            setSelectedQueue(queue);
        } else {
            setForm({ 
                name: '', 
                description: '', 
                isActive: true, 
                categoryId: '',
                stepId: '',
                quaiId: ''
            });
            setSelectedQueue(null);
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        const payload = { ...form };

        if (selectedQueue) {
            updateQueue.mutate({ id: selectedQueue.queueId, data: payload }, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast('File d\'attente mise à jour', 'success');
                },
                onError: () => toast('Erreur lors de la mise à jour', 'error')
            });
        } else {
            createQueue.mutate(payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast('File d\'attente créée avec succès', 'success');
                },
                onError: () => toast('Erreur lors de la création', 'error')
            });
        }
    };

    const toggleStatus = (queue: Queue) => {
        updateQueue.mutate({ 
            id: queue.queueId, 
            data: { ...queue, isActive: !queue.isActive } 
        }, {
            onSuccess: () => toast(`File ${!queue.isActive ? 'activée' : 'désactivée'}`, 'info')
        });
    };

    const handleBulkStatusChange = (isActive: boolean) => {
        bulkUpdateQueueStatus.mutate({ ids: selectedIds, isActive }, {
            onSuccess: () => {
                clearSelection();
                toast(`${selectedCount} files ${isActive ? 'activées' : 'désactivées'}`, 'success');
            }
        });
    };

    const isLoading = isLoadingQueues || isLoadingCategories || isLoadingWorkflows || isLoadingQuais;

    if (isLoading) return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div className="w-64 h-8 bg-slate-200/50 animate-pulse rounded-lg" />
                <div className="w-32 h-8 bg-slate-200/50 animate-pulse rounded-lg" />
            </div>
            <AdminSkeleton variant="card" count={6} />
        </div>
    );

    // Flatten all steps from all workflows for the selector
    const allSteps = workflows.flatMap(w => (w.steps || []).map(s => ({ ...s, workflowName: w.name })));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg"><ListOrdered className="h-5 w-5 text-primary" /></div>
                        <h3 className="text-xl font-bold">Files d'attente</h3>
                    </div>
                    {queues.length > 0 && (
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
                <Button size="sm" onClick={() => handleOpenModal()} className="rounded-xl shadow-md"><Plus className="h-4 w-4 mr-2" /> Créer une file</Button>
            </div>

            {queues.length === 0 ? (
                <EmptyState
                    icon={ListOrdered}
                    title="Aucune file d'attente"
                    description="Vous n'avez pas encore créé de file d'attente. Les files d'attente permettent de gérer le flux des camions."
                    actionLabel="Créer une file"
                    onAction={() => handleOpenModal()}
                />
            ) : (
                <div className="grid gap-4">
                    {queues.map(queue => (
                        <Card 
                            key={queue.queueId} 
                            className={cn(
                                "border-0 shadow-lg bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 relative group",
                                isSelected(queue.queueId) ? "ring-2 ring-primary bg-primary/5 shadow-primary/20" : "bg-white/50 backdrop-blur-sm",
                                !queue.isActive && !isSelected(queue.queueId) && "opacity-75 grayscale-[0.5]"
                            )}
                        >
                            <div className="absolute top-4 right-20 z-20">
                                <input 
                                    type="checkbox" 
                                    checked={isSelected(queue.queueId)} 
                                    onChange={() => toggleSelect(queue.queueId)}
                                    className={cn(
                                        "h-6 w-6 rounded-md border-primary/30 accent-primary cursor-pointer transition-all shadow-md",
                                        isSelected(queue.queueId) ? "opacity-100 scale-110" : "opacity-40 hover:opacity-100"
                                    )}
                                />
                            </div>
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-black text-text-main text-lg">{queue.name}</h4>
                                        <Badge variant={queue.isActive ? 'success' : 'secondary'} className="text-[10px]">{queue.isActive ? 'Active' : 'Désactivée'}</Badge>
                                        {queue.category && (
                                            <Badge 
                                                style={{ backgroundColor: `${queue.category.color}20`, color: queue.category.color, borderColor: `${queue.category.color}40` }}
                                                className="text-[10px] border"
                                            >
                                                <Tag className="h-3 w-3 mr-1" />
                                                {queue.category.name}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-4 pt-1">
                                        {queue.step && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase">
                                                <GitBranch className="h-3 w-3" />
                                                Étape: {queue.step.name}
                                            </div>
                                        )}
                                        {queue.quai && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase">
                                                <Monitor className="h-3 w-3" />
                                                Quai: {queue.quai.label}
                                            </div>
                                        )}
                                        {queue.description && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase">
                                                <Info className="h-3 w-3" />
                                                {queue.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className={cn(
                                            "h-9 w-9 rounded-xl transition-colors",
                                            queue.isActive ? "hover:bg-danger/10 text-danger" : "hover:bg-success/10 text-success"
                                        )}
                                        onClick={() => toggleStatus(queue)}
                                        title={queue.isActive ? "Désactiver" : "Activer"}
                                    >
                                        {queue.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-primary/10" onClick={() => handleOpenModal(queue)}><Edit2 className="h-4 w-4 text-primary" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedQueue ? "Modifier la file d'attente" : "Nouvelle file d'attente"}>
                <div className="space-y-5 py-4">
                    <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-text-muted ml-1">Nom de la file</label>
                        <Input placeholder="Ex: File d'attente Ventes" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl h-11" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-text-muted ml-1">Étape du Workflow</label>
                            <select 
                                value={form.stepId} 
                                onChange={(e) => setForm({ ...form, stepId: e.target.value })}
                                className="w-full h-11 rounded-xl border border-border bg-white/50 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Non assignée</option>
                                {allSteps.map(step => (
                                    <option key={step.stepId} value={step.stepId}>
                                        [{step.workflowName}] {step.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-text-muted ml-1">Quai Physique</label>
                            <select 
                                value={form.quaiId} 
                                onChange={(e) => setForm({ ...form, quaiId: e.target.value })}
                                className="w-full h-11 rounded-xl border border-border bg-white/50 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Non assigné</option>
                                {quais.map(quai => (
                                    <option key={quai.quaiId} value={quai.quaiId!}>
                                        {quai.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-text-muted ml-1">Catégorie associée (Facultatif)</label>
                        <select 
                            value={form.categoryId} 
                            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                            className="w-full h-11 rounded-xl border border-border bg-white/50 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Toutes les catégories</option>
                            {categories.map(cat => (
                                <option key={cat.categoryId} value={cat.categoryId}>
                                    {cat.name} ({cat.prefix})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-text-muted ml-1">Description</label>
                        <textarea 
                            value={form.description} 
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Description facultative..."
                            className="w-full h-24 rounded-xl border border-border bg-white/50 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-white/40">
                        <input type="checkbox" id="queue-active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-5 w-5 rounded accent-primary" />
                        <label htmlFor="queue-active" className="text-sm font-bold cursor-pointer">File d'attente active</label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl h-11 px-6">Annuler</Button>
                        <Button onClick={handleSave} isLoading={updateQueue.isPending || createQueue.isPending} className="rounded-xl h-11 px-8 shadow-lg shadow-primary/20">
                            {selectedQueue ? 'Enregistrer' : 'Créer'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <BulkActionsToolbar 
                selectedCount={selectedCount}
                onActivate={() => handleBulkStatusChange(true)}
                onDeactivate={() => handleBulkStatusChange(false)}
                onClear={clearSelection}
                isLoading={bulkUpdateQueueStatus.isPending}
                label="files sélectionnées"
            />
        </div>
    );
};
