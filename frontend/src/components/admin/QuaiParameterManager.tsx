import { useState } from 'react';
import { useQuaiParameters, type QuaiParameter } from '../../hooks/useQuaiParameters';
import { useWorkflows } from '../../hooks/useWorkflows';
import { useUsers } from '../../hooks/useUsers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../molecules/ui/card';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Plus, Trash2, Edit2, Layout, Code, Save, X, Loader2, MapPin } from 'lucide-react';
import { useSites } from '../../hooks/useSites';
import { Modal } from '../molecules/ui/modal';
import { cn } from '../../lib/utils';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quaiParameterSchema } from '../../lib/validation';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActionsToolbar } from '../molecules/BulkActionsToolbar';
import { AdminSkeleton } from '../molecules/ui/admin-skeleton';
import { EmptyState } from '../molecules/ui/empty-state';
import type { z } from 'zod';

type QuaiParameterFormValues = z.infer<typeof quaiParameterSchema>;

export const QuaiParameterManager = () => {
  const { parameters, isLoading, saveParameter, deleteParameter, bulkDeleteParameters } = useQuaiParameters();
  const { workflows } = useWorkflows();
  const { users } = useUsers();
  const { sites = [] } = useSites();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<QuaiParameter | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isValid, isDirty }
  } = useForm<QuaiParameterFormValues>({
    resolver: zodResolver(quaiParameterSchema) as any,
    defaultValues: {
      label: '',
      siteId: '',
      stepId: '',
      queueIds: [],
      formConfig: [],
      allowedUsers: []
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
  } = useBulkSelection(parameters.map(p => p.quaiId!));

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'formConfig'
  });

  const watchedStepId = watch('stepId');
  const watchedAllowedUsers = watch('allowedUsers') || [];
  const watchedQueueIds = watch('queueIds') || [];
  const watchedFormConfig = watch('formConfig') || [];

  const handleOpenModal = (param: QuaiParameter | null = null) => {
    if (param) {
      setEditingParam(param);
      reset({
        label: param.label,
        siteId: param.siteId ?? '',
        stepId: param.stepId,
        queueIds: param.queueIds ?? (param.queues ? param.queues.map(q => q.queueId) : []),
        formConfig: param.formConfig ?? [],
        allowedUsers: param.allowedUsers ?? []
      });
    } else {
      setEditingParam(null);
      reset({
        label: '',
        siteId: '',
        stepId: '',
        queueIds: [],
        formConfig: [],
        allowedUsers: []
      });
    }
    setIsModalOpen(true);
  };

  const onSave = (data: QuaiParameterFormValues) => {
    saveParameter.mutate(data as any, {
      onSuccess: () => setIsModalOpen(false)
    });
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Voulez-vous vraiment supprimer les ${selectedCount} configurations de quais sélectionnées ?`)) {
      bulkDeleteParameters.mutate(selectedIds, {
        onSuccess: () => clearSelection()
      });
    }
  };

  const toggleUser = (userId: string) => {
    const current = [...watchedAllowedUsers];
    const index = current.indexOf(userId);
    if (index > -1) {
      setValue('allowedUsers', current.filter(id => id !== userId), { shouldDirty: true });
    } else {
      setValue('allowedUsers', [...current, userId], { shouldDirty: true });
    }
  };

  const toggleQueue = (queueId: string) => {
    const current = [...watchedQueueIds];
    const index = current.indexOf(queueId);
    if (index > -1) {
      setValue('queueIds', current.filter(id => id !== queueId), { shouldDirty: true });
    } else {
      setValue('queueIds', [...current, queueId], { shouldDirty: true });
    }
  };

  // Liste plate de toutes les étapes de tous les workflows pour le select
  const allSteps = workflows.flatMap(wf => 
    (wf.steps || []).map(step => ({
      ...step,
      workflowName: wf.name
    }))
  );

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Layout className="h-6 w-6 text-primary" /> Configuration des Quais Dynamiques
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Gérez les terminaux et les formulaires par étape.</p>
          </div>
          {parameters.length > 0 && (
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
        <Button onClick={() => handleOpenModal()} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" /> Nouveau Quai
        </Button>
      </div>

      {parameters.length === 0 ? (
          <EmptyState
            icon={Layout}
            title="Aucune configuration de quai"
            description="Vous n'avez pas encore défini de configurations pour vos terminaux d'accueil."
            actionLabel="Nouveau Quai"
            onAction={() => handleOpenModal()}
          />
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parameters.map(param => (
          <Card 
            key={param.quaiId} 
            className={cn(
              "border transition-all duration-300 relative group overflow-hidden rounded-2xl",
              isSelected(param.quaiId!) 
                ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xl shadow-primary/10" 
                : "border-slate-200/60 shadow-lg bg-white hover:shadow-xl hover:border-primary/20"
            )}
          >
            <div className="absolute top-4 right-4 z-20">
              <input 
                type="checkbox" 
                checked={isSelected(param.quaiId!)} 
                onChange={() => toggleSelect(param.quaiId!)}
                className={cn(
                  "h-6 w-6 rounded-md border-primary/30 accent-primary cursor-pointer transition-all shadow-md",
                  isSelected(param.quaiId!) ? "opacity-100 scale-110" : "opacity-40 hover:opacity-100"
                )}
              />
            </div>
            <CardHeader className="p-6 pb-2">
              <div className="flex justify-between items-start">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Layout className="h-6 w-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenModal(param)} className="h-8 w-8 rounded-lg hover:bg-primary/10"><Edit2 className="h-4 w-4 text-primary" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteParameter.mutate(param.quaiId!)} className="h-8 w-8 rounded-lg hover:bg-danger/10"><Trash2 className="h-4 w-4 text-danger" /></Button>
                </div>
              </div>
              <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight">{param.label}</CardTitle>
              <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Code className="h-3 w-3" /> ID: {param.quaiId?.slice(0, 8)}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Site</span>
                  <div className="flex items-center gap-1.5 font-black text-emerald-600">
                    <MapPin className="h-3 w-3" />
                    {sites.find((site) => site.siteId === param.siteId)?.name || 'Non spécifié'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Étape liée</span>
                  <span className="font-black text-primary">{allSteps.find(s => s.stepId === param.stepId)?.name || 'Inconnue'}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Files (Queues)</span>
                  <span className="font-black text-indigo-600">
                    {param.queues && param.queues.length > 0 
                      ? param.queues.map(q => q.name).join(', ') 
                      : 'Par défaut / Toutes'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Champs Form.</span>
                  <span className="font-black text-slate-700">{param.formConfig.length} champs</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Accès</span>
                  <div className="flex -space-x-2">
                    {param.allowedUsers.slice(0, 3).map(uid => {
                      const user = users.find(u => u.userId === uid);
                      return (
                        <div key={uid} className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-black" title={user?.username}>
                          {user?.username?.substring(0, 2).toUpperCase()}
                        </div>
                      );
                    })}
                    {param.allowedUsers.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-primary text-white border-2 border-white flex items-center justify-center text-[8px] font-black">
                        +{param.allowedUsers.length - 3}
                      </div>
                    )}
                    {param.allowedUsers.length === 0 && <span className="text-slate-300 italic">Tous</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingParam ? `Modifier ${editingParam.label}` : "Nouveau Quai Dynamique"} size="xl" isDirty={isDirty}>
        <form onSubmit={handleSubmit(onSave)} className="space-y-6 py-4 px-1 max-h-[75vh] overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nom du terminal</label>
              <Input placeholder="Ex: Quai de Pesée Sud" {...register('label')} error={errors.label?.message} className="h-11 rounded-xl" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Site d'exploitation</label>
              <select 
                className={cn(
                  "w-full h-11 px-3 border-2 border-slate-100 rounded-xl outline-none font-bold text-sm bg-white transition-all",
                  errors.siteId ? "border-danger focus:ring-danger/20" : "focus:border-primary/50"
                )}
                {...register('siteId')}
              >
                <option value="">-- Sélectionner un site --</option>
                {sites.map((site) => (
                  <option key={site.siteId} value={site.siteId}>{site.name}</option>
                ))}
              </select>
              {errors.siteId && <p className="text-[10px] font-bold text-danger ml-1">{errors.siteId.message}</p>}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Étape du Workflow</label>
              <select 
                className={cn(
                  "w-full h-11 px-3 border-2 border-slate-100 rounded-xl outline-none font-bold text-sm bg-white transition-all",
                  errors.stepId ? "border-danger focus:ring-danger/20" : "focus:border-primary/50"
                )}
                {...register('stepId')}
              >
                <option value="">-- Sélectionner une étape --</option>
                {workflows.map((wf, wfIdx) => (
                  <optgroup key={wf.workflowId || `wf-opt-${wfIdx}`} label={wf.name}>
                    {(wf.steps || []).map((step, sIdx) => (
                      <option key={step.stepId || `step-opt-${sIdx}`} value={step.stepId}>
                        {step.name} (Ordre {(step as any).orderNumber || step.order})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.stepId && <p className="text-[10px] font-bold text-danger ml-1">{errors.stepId.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic">Files d'attente liées (Optionnel)</label>
            <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 min-h-[60px]">
              {!watchedStepId && <p className="text-[10px] text-slate-400 italic">Sélectionnez d'abord une étape pour voir les files d'attente.</p>}
              {watchedStepId && allSteps.find(s => s.stepId === watchedStepId)?.queues?.map((q: any) => (
                <div 
                  key={q.queueId} 
                  onClick={() => toggleQueue(q.queueId)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all border-2",
                    watchedQueueIds.includes(q.queueId) 
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-indigo-300"
                  )}
                >
                  {q.name}
                </div>
              ))}
              {watchedStepId && (!allSteps.find(s => s.stepId === watchedStepId)?.queues || allSteps.find(s => s.stepId === watchedStepId)?.queues?.length === 0) && (
                <p className="text-[10px] text-slate-400 italic">Aucune file d'attente n'est liée à cette étape dans le workflow.</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Configuration du Formulaire</label>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', label: '', type: 'text', required: false, options: [] })} className="h-7 text-[10px] rounded-lg border-primary/20 text-primary">
                + Ajouter un champ
              </Button>
            </div>
            
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 max-h-96 overflow-y-auto">
              {fields.map((field, idx) => (
                <div key={field.id} className="space-y-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input 
                        placeholder="Label (ex: Poids Brut)" 
                        {...register(`formConfig.${idx}.label` as const)} 
                        onChange={(e) => {
                            const val = e.target.value;
                            setValue(`formConfig.${idx}.label`, val);
                            setValue(`formConfig.${idx}.name`, val.toLowerCase().replace(/\s+/g, '_'));
                        }}
                        error={(errors.formConfig as any)?.[idx]?.label?.message}
                        className="h-9 text-xs rounded-lg" 
                      />
                    </div>
                    <div className="col-span-3">
                      <select 
                        className="w-full h-9 px-2 bg-slate-50 border rounded-lg text-xs font-bold outline-none" 
                        {...register(`formConfig.${idx}.type` as const)}
                      >
                        <option value="text">Texte</option>
                        <option value="number">Nombre</option>
                        <option value="select">Liste</option>
                      </select>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 px-2">
                      <input type="checkbox" {...register(`formConfig.${idx}.required` as const)} className="rounded accent-primary" />
                      <span className="text-[8px] font-black uppercase text-slate-400">Requis</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)} className="h-8 w-8 text-danger hover:bg-danger/10">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {watchedFormConfig[idx]?.type === 'select' && (
                    <div className="pl-4 border-l-2 border-primary/20 space-y-1">
                      <label className="text-[8px] font-black uppercase text-primary">Options (Séparées par des virgules)</label>
                      <Input 
                        placeholder="Option 1, Option 2, Option 3" 
                        {...register(`formConfig.${idx}.options` as const, {
                            setValueAs: (v) => typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(s => s !== '') : v
                        })}
                        className="h-8 text-[10px] rounded-lg bg-primary/5 border-primary/10"
                      />
                    </div>
                  )}
                </div>
              ))}
              {fields.length === 0 && <p className="text-center py-4 text-xs font-bold text-slate-300 italic">Aucun champ configuré</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Utilisateurs Autorisés (Laissez vide pour tous)</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              {users.filter(u => u.role !== 'ADMINISTRATOR').map(user => (
                <div 
                  key={user.userId} 
                  onClick={() => toggleUser(user.userId)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all border-2",
                    watchedAllowedUsers.includes(user.userId) 
                      ? "bg-primary border-primary text-white shadow-md shadow-primary/20" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-primary/30"
                  )}
                >
                  {user.username}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl h-11 px-6">Annuler</Button>
            <Button 
              type="submit"
              className="rounded-xl h-11 px-8 shadow-lg shadow-primary/20"
              disabled={!isValid || saveParameter.isPending}
            >
              {saveParameter.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {editingParam ? 'Enregistrer les modifications' : 'Créer le terminal'}
            </Button>
          </div>
        </form>
      </Modal>

      <BulkActionsToolbar 
        selectedCount={selectedCount}
        onDelete={handleBulkDelete}
        onClear={clearSelection}
        isLoading={bulkDeleteParameters.isPending}
        label="quais sélectionnés"
      />
    </div>
  );
};
