import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useWorkflows } from '../../hooks/useWorkflows';
import { useQueues } from '../../hooks/useQueues';
import type { Workflow, WorkflowStep } from '../../types/ticket';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Card, CardContent } from '../molecules/ui/card';
import { Badge } from '../atoms/ui/badge';
import { Loader2, Plus, Edit2, ArrowRight, Network, Layers, GitGraph, List, Power, PowerOff } from 'lucide-react';
import { Modal } from '../molecules/ui/modal';
import { toast } from '../molecules/ui/toast';
import { WorkflowVisualEditor } from './WorkflowVisualEditor';
import { useForm } from 'react-hook-form';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActionsToolbar } from '../molecules/BulkActionsToolbar';
import { zodResolver } from '@hookform/resolvers/zod';
import { workflowSchema, workflowStepSchema } from '../../lib/validation';
import { AdminSkeleton } from '../molecules/ui/admin-skeleton';
import { EmptyState } from '../molecules/ui/empty-state';

export const WorkflowManager = () => {
    const { workflows, isLoading, createWorkflow, updateWorkflow, addStep, updateStep, bulkUpdateWorkflowStatus, reorderSteps } = useWorkflows();
    const { queues } = useQueues();

    // View Mode State
    const [viewMode, setViewMode] = useState<'list' | 'visual'>('list');

    // Workflow Modal State
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [isWfModalOpen, setIsWfModalOpen] = useState(false);
    
    // Workflow Form
    const {
        register: registerWf,
        handleSubmit: handleSubmitWf,
        reset: resetWf,
        formState: { errors: wfErrors, isValid: isWfValid, isDirty: isWfDirty }
    } = useForm({
        resolver: zodResolver(workflowSchema),
        defaultValues: { name: '', description: '', isActived: true },
        mode: 'onChange'
    });

    // Step Form
    const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
    const [isStepModalOpen, setIsStepModalOpen] = useState(false);
    const {
        register: registerStep,
        handleSubmit: handleSubmitStep,
        reset: resetStep,
        watch: watchStep,
        setValue: setStepValue,
        formState: { errors: stepErrors, isValid: isStepValid, isDirty: isStepDirty }
    } = useForm({
        resolver: zodResolver(workflowStepSchema),
        defaultValues: {
            name: '',
            queueIds: [] as string[],
            orderNumber: 1,
            isActived: true,
            formConfig: [] as any[]
        },
        mode: 'onChange'
    });

    const {
        selectedIds,
        selectedCount,
        isAllSelected,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected
    } = useBulkSelection(workflows.map(wf => wf.workflowId!));

    const watchedStepQueueIds = watchStep('queueIds') || [];
    const watchedStepOrder = watchStep('orderNumber');
    const watchedStepIsActived = watchStep('isActived');

    const handleOpenWfModal = (workflow: Workflow | null = null) => {
        if (workflow) {
            setSelectedWorkflow(workflow);
            resetWf({ 
                name: workflow.name, 
                description: workflow.description || '',
                isActived: workflow.isActived ?? true
            });
        } else {
            setSelectedWorkflow(null);
            resetWf({ name: '', description: '', isActived: true });
        }
        setIsWfModalOpen(true);
    };

    const onSaveWorkflow = (data: any) => {
        if (selectedWorkflow) {
            updateWorkflow.mutate({ id: selectedWorkflow.workflowId, data }, {
                onSuccess: () => {
                    setIsWfModalOpen(false);
                }
            });
        } else {
            createWorkflow.mutate(data, {
                onSuccess: () => {
                    setIsWfModalOpen(false);
                }
            });
        }
    };

    const toggleWfStatus = (wf: Workflow) => {
        updateWorkflow.mutate({ 
            id: wf.workflowId, 
            data: { ...wf, isActived: !wf.isActived } 
        }, {
            onSuccess: () => toast(`Workflow ${!wf.isActived ? 'activé' : 'désactivé'}`, 'info')
        });
    };

    const handleBulkStatusChange = (isActive: boolean) => {
        bulkUpdateWorkflowStatus.mutate({ ids: selectedIds, isActive }, {
            onSuccess: () => {
                clearSelection();
                toast(`${selectedCount} workflows ${isActive ? 'activés' : 'désactivés'}`, 'success');
            }
        });
    };

    const handleOpenStepModal = (workflow: Workflow, step: WorkflowStep | null = null) => {
        setSelectedWorkflow(workflow);
        setSelectedStep(step);
        if (step) {
            resetStep({
                name: step.name || '',
                queueIds: (step as any).queues?.map((q: any) => q.queueId) || (step.queueId ? [step.queueId] : []),
                orderNumber: (step as any).orderNumber || (step as any).order || 0,
                isActived: (step as any).isActived !== false,
                formConfig: step.formConfig || []
            });
        } else {
            resetStep({
                name: '',
                queueIds: [],
                orderNumber: (workflow.steps?.length || 0) + 1,
                isActived: true,
                formConfig: []
            });
        }
        setIsStepModalOpen(true);
    };

    const onSaveStep = (data: any) => {
        if (!selectedWorkflow) return;

        if (selectedStep) {
            updateStep.mutate({ id: selectedStep.stepId, data }, {
                onSuccess: () => {
                    setIsStepModalOpen(false);
                }
            });
        } else {
            addStep.mutate({ workflowId: selectedWorkflow.workflowId, data }, {
                onSuccess: () => {
                    setIsStepModalOpen(false);
                }
            });
        }
    };

    const toggleStepStatus = (e: React.MouseEvent, step: WorkflowStep) => {
        e.stopPropagation();
        updateStep.mutate({ 
            id: step.stepId, 
            data: { ...step, isActived: !(step as any).isActived } as any 
        }, {
            onSuccess: () => toast(`Étape ${!(step as any).isActived ? 'activée' : 'désactivée'}`, 'info')
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="w-64 h-8 bg-slate-200/50 animate-pulse rounded-lg" />
                    <div className="w-32 h-8 bg-slate-200/50 animate-pulse rounded-lg" />
                </div>
                <AdminSkeleton variant="card" count={4} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg"><Network className="h-5 w-5 text-primary" /></div>
                        <h3 className="text-xl font-bold">Gestion des Workflows Séquentiels</h3>
                    </div>
                    {workflows.length > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={toggleSelectAll}
                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl border border-primary/10 transition-all active:scale-95"
                        >
                            {isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            className="rounded-lg h-8 gap-2"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-3.5 w-3.5" /> Liste
                        </Button>
                        <Button
                            variant={viewMode === 'visual' ? 'default' : 'ghost'}
                            size="sm"
                            className="rounded-lg h-8 gap-2"
                            onClick={() => setViewMode('visual')}
                        >
                            <GitGraph className="h-3.5 w-3.5" /> Séquence
                        </Button>
                    </div>
                    <Button size="sm" onClick={() => handleOpenWfModal()} className="rounded-xl shadow-md"><Plus className="h-4 w-4 mr-2" /> Créer un Workflow</Button>
                </div>

            {workflows.length === 0 ? (
                <EmptyState
                    icon={Network}
                    title="Aucun Workflow Séquentiel"
                    description="Créez votre premier workflow pour définir le parcours des camions."
                    actionLabel="Nouveau Workflow"
                    onAction={() => handleOpenWfModal()}
                />
            ) : (
                <div className="grid gap-6">
                    {workflows.map((wf, wfIdx) => (
                    <Card 
                        key={wf.workflowId || `wf-${wfIdx}`} 
                        className={cn(
                            "border transition-all duration-300 relative group overflow-hidden rounded-2xl",
                            isSelected(wf.workflowId!) 
                                ? "border-primary ring-1 ring-primary/20 bg-primary/5 shadow-xl shadow-primary/10" 
                                : "border-slate-200/60 shadow-lg bg-white hover:shadow-xl",
                            !wf.isActived && !isSelected(wf.workflowId!) && "opacity-75 grayscale-[0.5]"
                        )}
                    >
                        <div className="absolute top-6 right-20 z-20">
                            <input 
                                type="checkbox" 
                                checked={isSelected(wf.workflowId!)} 
                                onChange={() => toggleSelect(wf.workflowId!)}
                                className={cn(
                                    "h-6 w-6 rounded-md border-primary/30 accent-primary cursor-pointer transition-all shadow-md",
                                    isSelected(wf.workflowId!) ? "opacity-100 scale-110" : "opacity-40 hover:opacity-100"
                                )}
                            />
                        </div>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="font-black text-2xl text-text-main flex items-center gap-2">
                                        {wf.name}
                                        {wf.isActived ? <Badge variant="success" className="text-[10px]">Actif</Badge> : <Badge variant="secondary" className="text-[10px]">Inactif</Badge>}
                                    </h4>
                                    <p className="text-sm text-text-muted font-medium mt-1">{wf.description || 'Aucune description'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className={cn(
                                            "h-9 w-9 rounded-xl transition-colors",
                                            wf.isActived ? "hover:bg-danger/10 text-danger" : "hover:bg-success/10 text-success"
                                        )}
                                        onClick={() => toggleWfStatus(wf)}
                                        title={wf.isActived ? "Désactiver" : "Activer"}
                                    >
                                        {wf.isActived ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-primary/10" onClick={() => handleOpenWfModal(wf)}><Edit2 className="h-4 w-4 text-primary" /></Button>
                                </div>
                            </div>

                            {viewMode === 'list' ? (
                                <div className="space-y-4" >
                                    <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase tracking-widest pl-1">
                                        <span className="flex items-center gap-2"><Layers className="h-3 w-3" /> Étapes du flux</span>
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary hover:bg-primary/5" onClick={() => handleOpenStepModal(wf)}>+ Ajouter une étape</Button>
                                    </div>

                                    <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                        {[...(wf.steps || [])].sort((a, b) => ((a as any).orderNumber || a.order) - ((b as any).orderNumber || b.order)).map((step, idx, arr) => {
                                            const stepOrder = (step as any).orderNumber || step.order;
                                            const isFirst = stepOrder === Math.min(...arr.map(s => (s as any).orderNumber || s.order));
                                            const isLast = stepOrder === Math.max(...arr.map(s => (s as any).orderNumber || s.order));
                                            
                                            return (
                                                <div key={step.stepId || `step-${idx}`} className="flex items-center">
                                                    <div
                                                        className="group relative cursor-pointer"
                                                        onClick={() => handleOpenStepModal(wf, step)}
                                                    >
                                                        <div className={cn(
                                                            "px-6 py-3 rounded-2xl border-2 transition-all duration-300 shadow-sm flex flex-col items-center gap-1",
                                                            isFirst ? "border-success bg-success/5" : isLast ? "border-danger bg-danger/5" : "border-primary/20 bg-white",
                                                            (step as any).isActived === false && "opacity-50 grayscale"
                                                        )}>
                                                            <span className="font-black text-sm whitespace-nowrap">{step.name || (step as any).queues?.[0]?.name || 'File non définie'}</span>
                                                            <div className="flex flex-wrap gap-1 justify-center max-w-[150px]">
                                                                {(step as any).queues?.map((q: any) => (
                                                                    <Badge key={q.queueId} variant="outline" className="text-[8px] px-1 py-0 h-3 leading-none bg-primary/5 border-primary/20 text-primary uppercase">{q.name}</Badge>
                                                                ))}
                                                                {(!(step as any).queues || (step as any).queues.length === 0) && (
                                                                    <span className="text-[10px] text-gray-400 italic">Sans file</span>
                                                                )}
                                                            </div>
                                                            <span className="text-[9px] font-bold text-primary/60 flex items-center gap-1">
                                                                Ordre {stepOrder} {(step as any).isActived === false && "(Désactivée)"}
                                                            </span>
                                                        </div>
                                                        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button 
                                                                variant="secondary" 
                                                                size="sm" 
                                                                className={cn(
                                                                    "h-6 w-6 p-0 rounded-full shadow-md",
                                                                    (step as any).isActived !== false ? "text-danger hover:bg-danger/10" : "text-success hover:bg-success/10"
                                                                )}
                                                                onClick={(e) => toggleStepStatus(e, step)}
                                                            >
                                                                {(step as any).isActived !== false ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                                                            </Button>
                                                            <Button variant="secondary" size="sm" className="h-6 w-6 p-0 rounded-full shadow-md"><Edit2 className="h-3 w-3" /></Button>
                                                        </div>
                                                    </div>
                                                    {idx < arr.length - 1 && <ArrowRight className="h-5 w-5 mx-2 text-primary/30 animate-pulse-slow" />}
                                                </div>
                                            );
                                        })}
                                        {(!wf.steps || wf.steps.length === 0) && (
                                            <div className="flex-1 text-center py-6 bg-white/20 rounded-2xl border-2 border-dashed border-primary/10">
                                                <span className="text-sm text-text-muted font-bold italic">Aucune étape définie pour ce flux</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <WorkflowVisualEditor
                                    workflow={wf}
                                    isSaving={reorderSteps.isPending}
                                    onSave={(steps) => {
                                        reorderSteps.mutate({ workflowId: wf.workflowId, steps }, {
                                            onSuccess: () => toast("Séquence mise à jour avec succès", "success")
                                        });
                                    }}
                                    onAddStep={() => handleOpenStepModal(wf)}
                                    onEditStep={(step) => handleOpenStepModal(wf, step)}
                                    onDeleteStep={() => toast("Suppression désactivée.", "info")}
                                />
                            )}
                        </CardContent>
                    </Card >
                ))}
            </div>
            )}

            <Modal isOpen={isWfModalOpen} onClose={() => setIsWfModalOpen(false)} title={selectedWorkflow ? "Modifier le Workflow" : "Nouveau Workflow"} isDirty={isWfDirty}>
                <form onSubmit={handleSubmitWf(onSaveWorkflow)} className="space-y-4 py-4 px-1">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nom du workflow</label>
                        <Input placeholder="Ex: Flux Standard SIBM" {...registerWf('name')} error={wfErrors.name?.message} className="h-12" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</label>
                        <Input placeholder="Description des objectifs du flux..." {...registerWf('description')} error={wfErrors.description?.message} className="h-12" />
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => setIsWfModalOpen(false)} className="rounded-xl h-11 px-8">Annuler</Button>
                        <Button type="submit" disabled={!isWfValid || createWorkflow.isPending || updateWorkflow.isPending} className="rounded-xl h-11 px-10 shadow-lg shadow-primary/20">
                            {createWorkflow.isPending || updateWorkflow.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {selectedWorkflow ? 'Enregistrer les modifications' : 'Créer le Workflow'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isStepModalOpen} onClose={() => setIsStepModalOpen(false)} title={selectedStep ? `Configuration de l'étape` : "Ajouter une étape"} isDirty={isStepDirty}>
                <form onSubmit={handleSubmitStep(onSaveStep)} className="space-y-5 py-4 px-1 max-h-[75vh] overflow-y-auto pr-2">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Libellé de l'étape</label>
                        <Input placeholder="Ex: Accueil & Identification" {...registerStep('name')} error={stepErrors.name?.message} className="h-11" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-black uppercase text-slate-400">Files d'attente autorisées</label>
                            {stepErrors.queueIds && <span className="text-[10px] font-bold text-danger">{stepErrors.queueIds.message}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 max-h-[200px] overflow-y-auto">
                            {queues.map(q => (
                                <label key={q.queueId} className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                    watchedStepQueueIds.includes(q.queueId) ? "border-primary/30 bg-primary/5 text-primary" : "border-white bg-white hover:border-slate-200 text-slate-600"
                                )}>
                                    <input 
                                        type="checkbox" 
                                        className="h-4 w-4 rounded accent-primary"
                                        checked={watchedStepQueueIds.includes(q.queueId)}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            const newVal = checked 
                                                ? [...watchedStepQueueIds, q.queueId]
                                                : watchedStepQueueIds.filter(id => id !== q.queueId);
                                            setStepValue('queueIds', newVal, { shouldValidate: true, shouldDirty: true });
                                        }}
                                    />
                                    <span className="text-[11px] font-bold uppercase tracking-tight">{q.name}</span>
                                </label>
                            ))}
                            {queues.length === 0 && <span className="text-[10px] text-slate-400 col-span-2 text-center py-4 italic">Aucune file d'attente disponible.</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ordre de passage</label>
                            <Input type="number" {...registerStep('orderNumber', { valueAsNumber: true })} error={stepErrors.orderNumber?.message} className="h-11" />
                        </div>
                        <div className="flex flex-col justify-end pb-1 pl-1">
                            <label className={cn(
                                "flex items-center gap-2 p-3 h-11 rounded-xl border transition-all cursor-pointer select-none",
                                watchedStepIsActived ? "border-success/30 bg-success/5 text-success" : "border-slate-100 bg-slate-50 text-slate-400"
                            )}>
                                <input type="checkbox" {...registerStep('isActived')} className="h-5 w-5 rounded-lg accent-success" />
                                <span className="text-[10px] font-black uppercase tracking-wider">{watchedStepIsActived ? "Étape Active" : "Étape Désactivée"}</span>
                            </label>
                        </div>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-3 h-3 rounded-full shadow-sm animate-pulse-slow", watchedStepOrder === 1 ? "bg-success" : "bg-primary/40")} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                                    Status : {watchedStepOrder === 1 ? "Début de flux" : "Point d'étape"}
                                </span>
                                <p className="text-[9px] font-bold text-slate-400 italic">
                                    {watchedStepOrder === 1 ? "Cette étape sera la première proposée aux véhicules lors de l'entrée sur site." : "Cette étape sera accessible via les transitions définies dans le flux."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => setIsStepModalOpen(false)} className="rounded-xl px-6 h-11">Annuler</Button>
                        <Button type="submit" disabled={!isStepValid || addStep.isPending || updateStep.isPending} className="rounded-xl px-10 h-11 shadow-lg shadow-primary/20">
                            {addStep.isPending || updateStep.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {selectedStep ? 'Mettre à jour l\'étape' : 'Ajouter au Workflow'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <BulkActionsToolbar 
                selectedCount={selectedCount}
                onActivate={() => handleBulkStatusChange(true)}
                onDeactivate={() => handleBulkStatusChange(false)}
                onClear={clearSelection}
                isLoading={bulkUpdateWorkflowStatus.isPending}
                label="workflows sélectionnés"
            />
        </div>
    );
};
