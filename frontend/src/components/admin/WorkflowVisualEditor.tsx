import { useState, useEffect } from 'react';
import type { Workflow, WorkflowStep } from '../../types/ticket';
import { Button } from '../atoms/ui/button';
import { 
    Save, 
    Plus, 
    GripVertical, 
    Trash2, 
    Settings2, 
    ArrowDown,
    Loader2
} from 'lucide-react';
import { Card } from '../molecules/ui/card';
import { Reorder, useDragControls } from 'framer-motion';

interface Props {
    workflow: Workflow;
    onSave: (steps: { stepId: string; orderNumber: number }[]) => void;
    onAddStep: () => void;
    onEditStep: (step: WorkflowStep) => void;
    onDeleteStep: (stepId: string) => void;
    isSaving?: boolean;
}

export const WorkflowVisualEditor = ({ workflow, onSave, onAddStep, onEditStep, onDeleteStep, isSaving }: Props) => {
    // Initial order based on orderNumber
    const initialSteps = [...(workflow.steps || [])].sort((a, b) => {
        const orderA = (a as any).orderNumber || a.order || 0;
        const orderB = (b as any).orderNumber || b.order || 0;
        return orderA - orderB;
    });

    const [items, setItems] = useState<WorkflowStep[]>(initialSteps);

    // Sync state if workflow changes from outside
    useEffect(() => {
        setItems(initialSteps);
    }, [workflow.steps]);

    const handleSave = () => {
        const reorderedSteps = items.map((step, index) => ({
            stepId: step.stepId,
            orderNumber: index + 1
        }));
        onSave(reorderedSteps);
    };

    return (
        <div className="space-y-8 p-6 bg-slate-50/50 rounded-3xl border border-slate-200 shadow-inner">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Éditeur de Séquence Visuel</h3>
                    <p className="text-sm text-slate-500">Faites glisser les étapes pour réorganiser le parcours des camions.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onAddStep} className="rounded-xl border-slate-200 bg-white">
                        <Plus className="h-4 w-4 mr-2" /> Ajouter une étape
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="rounded-xl shadow-lg shadow-primary/20 min-w-[160px]"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Enregistrer l'ordre
                    </Button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto relative">
                {/* Ligne verticale de connexion */}
                {items.length > 1 && (
                    <div className="absolute left-1/2 top-8 bottom-8 w-1 bg-gradient-to-b from-primary/20 via-primary/5 to-primary/20 -translate-x-1/2 z-0 rounded-full" />
                )}

                <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-4">
                    {items.map((step, index) => (
                        <ReorderItem 
                            key={step.stepId} 
                            step={step} 
                            index={index} 
                            isFirst={index === 0}
                            isLast={index === items.length - 1}
                            onEdit={() => onEditStep(step)}
                            onDelete={() => onDeleteStep(step.stepId)}
                        />
                    ))}
                </Reorder.Group>

                {items.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Settings2 className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium">Aucune étape configurée.</p>
                        <Button variant="link" onClick={onAddStep} className="mt-2 text-primary font-bold">
                            Ajouter la première étape
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

interface ReorderItemProps {
    step: WorkflowStep;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

const ReorderItem = ({ step, index, isFirst, isLast, onEdit, onDelete }: ReorderItemProps) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={step}
            dragListener={false}
            dragControls={controls}
            className="relative z-10"
        >
            <Card className="p-4 border-slate-200 shadow-sm hover:shadow-md transition-all group bg-white rounded-2xl border-l-4 border-l-transparent hover:border-l-primary">
                <div className="flex items-center gap-4">
                    <div 
                        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-primary transition-colors p-2"
                        onPointerDown={(e) => controls.start(e)}
                    >
                        <GripVertical className="h-5 w-5" />
                    </div>
                    
                    <div className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center shadow-sm border-2
                        ${isFirst ? 'bg-success/10 border-success text-success' : 
                          isLast ? 'bg-danger/10 border-danger text-danger' : 
                          'bg-primary/5 border-primary/20 text-primary'}`}
                    >
                        <span className="text-xs font-black opacity-50 uppercase leading-none mb-0.5">Step</span>
                        <span className="font-black text-xl leading-none">{index + 1}</span>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-800 uppercase tracking-tight">{step.name || (step as any).queues?.[0]?.name || 'File non définie'}</h4>
                            {isFirst && <span className="px-2 py-0.5 bg-success/10 text-success text-[9px] font-black uppercase rounded-md tracking-widest">DÉPART</span>}
                            {isLast && <span className="px-2 py-0.5 bg-danger/10 text-danger text-[9px] font-black uppercase rounded-md tracking-widest">ARRIVÉE</span>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                             {(step as any).queues?.map((q: any) => (
                                <span key={q.queueId} className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase">{q.name}</span>
                             ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={onEdit} className="h-9 w-9 text-slate-400 hover:text-primary rounded-xl">
                            <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onDelete} className="h-9 w-9 text-slate-400 hover:text-danger rounded-xl">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
            
            {!isLast && (
                <div className="flex justify-center my-1 pointer-events-none">
                    <div className="bg-white/80 backdrop-blur-sm p-1 rounded-full border border-slate-200 shadow-sm">
                        <ArrowDown className="h-3 w-3 text-primary/40" />
                    </div>
                </div>
            )}
        </Reorder.Item>
    );
};
