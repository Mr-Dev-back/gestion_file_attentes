import type { Workflow, WorkflowStep } from '../../types/ticket';
import { Button } from '../atoms/ui/button';
import { 
    Save, 
    Plus, 
    GripVertical, 
    Trash2, 
    Settings2, 
    ArrowDown
} from 'lucide-react';
import { Card } from '../molecules/ui/card';

interface Props {
    workflow: Workflow;
    onSave: (steps: WorkflowStep[]) => void;
    onAddStep: () => void;
    onEditStep: (step: WorkflowStep) => void;
    onDeleteStep: (stepId: string) => void;
}

export const WorkflowVisualEditor = ({ workflow, onSave, onAddStep, onEditStep, onDeleteStep }: Props) => {
    const sortedSteps = [...(workflow.steps || [])].sort((a, b) => {
        const orderA = (a as any).orderNumber || a.order || 0;
        const orderB = (b as any).orderNumber || b.order || 0;
        return orderA - orderB;
    });

    const minOrder = Math.min(...sortedSteps.map(s => (s as any).orderNumber || s.order || 0));
    const maxOrder = Math.max(...sortedSteps.map(s => (s as any).orderNumber || s.order || 0));

    return (
        <div className="space-y-8 p-6 bg-slate-50/50 rounded-3xl border border-slate-200 shadow-inner">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Séquence du Flux Logistique</h3>
                    <p className="text-sm text-slate-500">Les tickets progressent séquentiellement selon l'ordre défini ci-dessous.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onAddStep} className="rounded-xl border-slate-200 bg-white">
                        <Plus className="h-4 w-4 mr-2" /> Ajouter une étape
                    </Button>
                    <Button onClick={() => onSave(sortedSteps)} className="rounded-xl shadow-lg shadow-primary/20">
                        <Save className="h-4 w-4 mr-2" /> Enregistrer l'ordre
                    </Button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-4 relative">
                {/* Ligne verticale de connexion */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2 z-0" />

                {sortedSteps.map((step, index) => {
                    const stepOrder = (step as any).orderNumber || step.order;
                    const isFirst = stepOrder === minOrder;
                    const isLast = stepOrder === maxOrder;

                    return (
                        <div key={step.stepId || `visual-step-${index}`} className="relative z-10">
                            <Card className="p-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow group bg-white rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors">
                                        <GripVertical className="h-5 w-5" />
                                    </div>
                                    
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-lg shadow-sm
                                        ${isFirst ? 'bg-success text-white' : 
                                          isLast ? 'bg-danger text-white' : 
                                          'bg-primary/10 text-primary border-2 border-primary/20'}`}
                                    >
                                        {stepOrder}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-slate-800 uppercase tracking-tight">{step.name || step.queue?.name || 'File non définie'}</h4>
                                            {isFirst && <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-black uppercase rounded-md flex items-center gap-1">Entrée</span>}
                                            {isLast && <span className="px-2 py-0.5 bg-danger/10 text-danger text-[10px] font-black uppercase rounded-md flex items-center gap-1">Sortie</span>}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {step.queue?.name || 'Aucune file associée'} • ID: {step.stepId.slice(0, 8)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => onEditStep(step)} className="h-9 w-9 text-slate-400 hover:text-primary">
                                            <Settings2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onDeleteStep(step.stepId)} className="h-9 w-9 text-slate-400 hover:text-danger">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                            
                            {index < sortedSteps.length - 1 && (
                                <div className="flex justify-center my-2">
                                    <div className="bg-slate-100 p-1 rounded-full border border-slate-200">
                                        <ArrowDown className="h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                    })}

                    {sortedSteps.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Settings2 className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium">Aucune étape configurée pour ce workflow.</p>
                        <Button variant="link" onClick={onAddStep} className="mt-2 text-primary font-bold">
                            Ajouter la première étape
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
