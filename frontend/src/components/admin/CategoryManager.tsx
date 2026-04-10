import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useQueues } from '../../hooks/useQueues';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Card, CardContent } from '../molecules/ui/card';
import { Badge } from '../atoms/ui/badge';
import { Plus, Edit2, Trash2, Tag, Truck } from 'lucide-react';
import { Modal, ConfirmModal } from '../molecules/ui/modal';
import { toast } from '../molecules/ui/toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema } from '../../lib/validation';
import { cn } from '../../lib/utils';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActionsToolbar } from '../molecules/BulkActionsToolbar';
import { AdminSkeleton } from '../molecules/ui/admin-skeleton';
import { EmptyState } from '../molecules/ui/empty-state';

export const CategoryManager = () => {
    const { 
        categories, 
        isLoading, 
        createCategory, 
        updateCategory, 
        deleteCategory,
        bulkDeleteCategories,
        bulkUpdateCategoryStatus
    } = useCategories();
    const { queues } = useQueues();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isValid, isDirty }
    } = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: '',
            prefix: '',
            estimatedDuration: 30,
            description: '',
            color: '#3b82f6',
            queueIds: [] as string[],
            isActive: true
        },
        mode: 'onChange'
    });

    const watchedQueueIds = watch('queueIds') || [];
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        selectedIds,
        selectedCount,
        isAllSelected,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected
    } = useBulkSelection(categories.map(c => c.categoryId));

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

    const handleOpenModal = (category: any = null) => {
        if (category) {
            setSelectedCategory(category);
            reset({
                name: category.name,
                prefix: category.prefix,
                estimatedDuration: category.estimatedDuration,
                description: category.description || '',
                color: category.color || '#3b82f6',
                queueIds: category.queues ? category.queues.map((q: any) => q.queueId) : [],
                isActive: category.isActive ?? true
            });
        } else {
            setSelectedCategory(null);
            reset({ 
                name: '', 
                prefix: '', 
                estimatedDuration: 30, 
                description: '', 
                color: '#3b82f6', 
                queueIds: [],
                isActive: true 
            });
        }
        setIsModalOpen(true);
    };

    const onSave = (data: any) => {
        if (selectedCategory) {
            updateCategory.mutate({ id: selectedCategory.categoryId, data } as any, {
                onSuccess: () => {
                    setIsModalOpen(false);
                }
            });
        } else {
            createCategory.mutate(data as any, {
                onSuccess: () => {
                    setIsModalOpen(false);
                }
            });
        }
    };

    const handleBulkDelete = () => {
        setConfirmState({
            isOpen: true,
            title: 'Suppression groupée',
            message: `Voulez-vous vraiment supprimer les ${selectedCount} catégories sélectionnées ?`,
            onConfirm: async () => {
                try {
                    await bulkDeleteCategories.mutateAsync(selectedIds);
                    clearSelection();
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const handleBulkStatusChange = (isActive: boolean) => {
        bulkUpdateCategoryStatus.mutate({ ids: selectedIds, isActive }, {
            onSuccess: () => clearSelection()
        });
    };

    const toggleQueue = (queueId: string) => {
        const currentIds = watchedQueueIds;
        const newIds = currentIds.includes(queueId)
            ? currentIds.filter(id => id !== queueId)
            : [...currentIds, queueId];
        setValue('queueIds', newIds, { shouldValidate: true, shouldDirty: true });
    };

    if (isLoading) return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div className="w-64 h-8 bg-slate-200/50 animate-pulse rounded-lg" />
                <div className="w-32 h-8 bg-slate-200/50 animate-pulse rounded-lg" />
            </div>
            <AdminSkeleton variant="card" count={6} />
        </div>
    );

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-black flex items-center gap-3">
                        <Tag className="h-6 w-6 text-primary" /> 
                        Catégories de produits
                    </h3>
                    {categories.length > 0 && (
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
                <Button size="sm" onClick={() => handleOpenModal()} className="rounded-xl shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" /> Nouvelle Catégorie
                </Button>
            </div>

            {categories.length === 0 ? (
                <EmptyState
                    icon={Tag}
                    title="Aucune catégorie de produit"
                    description="Vous n'avez pas encore configuré de catégories. Les catégories permettent de classer les produits dans le système."
                    actionLabel="Créer une catégorie"
                    onAction={() => handleOpenModal()}
                />
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category: any) => (
                        <Card 
                            key={category.categoryId} 
                            className={cn(
                                "border-border/50 transition-all relative group",
                                isSelected(category.categoryId) ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "hover:border-primary/20 hover:shadow-md"
                            )}
                        >
                            <div className="absolute top-3 right-3 z-20">
                                <input 
                                    type="checkbox" 
                                    checked={isSelected(category.categoryId)} 
                                    onChange={() => toggleSelect(category.categoryId)}
                                    className={cn(
                                        "rounded-md border-primary/30 h-5 w-5 accent-primary cursor-pointer transition-all shadow-sm",
                                        isSelected(category.categoryId) ? "opacity-100 scale-110" : "opacity-40 hover:opacity-100"
                                    )}
                                />
                            </div>
                            <CardContent className="p-5 flex flex-col gap-4 h-full">
                                <div className="flex justify-between items-start pt-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-lg shadow-inner border border-white/20" style={{ backgroundColor: category.color || '#3b82f6' }} />
                                        <div>
                                            <h4 className="font-black text-slate-700 leading-tight">{category.name}</h4>
                                            <span className="text-[10px] font-black tracking-widest text-primary/60 uppercase">{category.prefix}</span>
                                        </div>
                                    </div>
                                    <Badge variant={category.isActive ? "success" : "secondary"} className="rounded-lg font-black text-[10px] border-none">
                                        {category.isActive ? "ACTIF" : "INACTIF"}
                                    </Badge>
                                </div>

                                <p className="text-sm text-text-muted line-clamp-2 min-h-[2.5em]">{category.description || "Aucune description"}</p>

                                <div className="flex flex-wrap gap-1 mt-2">
                                    {category.queues && category.queues.length > 0 ? category.queues.map((q: any) => (
                                        <Badge key={q.queueId} variant="outline" className="text-[10px] bg-primary/5 border-primary/20"><Truck className="h-3 w-3 mr-1" />{q.name}</Badge>
                                    )) : <span className="text-xs text-text-muted italic">Aucune file associée</span>}
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t border-border/10 mt-auto">
                                    <Button size="sm" variant="ghost" className="h-8" onClick={() => handleOpenModal(category)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                    <Button size="sm" variant="ghost" className="h-8 text-danger" onClick={() => {
                                        setConfirmState({
                                            isOpen: true,
                                            title: 'Supprimer la catégorie',
                                            message: `Voulez-vous vraiment supprimer la catégorie "${category.name}" ?`,
                                            onConfirm: () => deleteCategory.mutate(category.categoryId, {
                                                onSuccess: () => toast('Catégorie supprimée', 'success'),
                                                onError: () => toast('Erreur lors de la suppression', 'error')
                                            })
                                        });
                                    }}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedCategory ? "Modifier Catégorie" : "Nouvelle Catégorie"} isDirty={isDirty}>
                <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nom de la catégorie</label>
                            <Input placeholder="Ex: Blé dur" {...register('name')} error={errors.name?.message} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Couleur</label>
                            <div className="flex items-center gap-2">
                                <input type="color" className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 p-1 bg-white" {...register('color')} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Préfixe Ticket</label>
                            <Input placeholder="Ex: BLE" {...register('prefix')} onChange={(e) => setValue('prefix', e.target.value.toUpperCase())} maxLength={5} error={errors.prefix?.message} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Durée Est. (min)</label>
                            <Input type="number" {...register('estimatedDuration', { valueAsNumber: true })} error={errors.estimatedDuration?.message} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</label>
                        <textarea
                            className={cn(
                                "flex w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all",
                                errors.description && "border-danger focus-visible:ring-danger/20"
                            )}
                            rows={3}
                            placeholder="Description optionnelle..."
                            {...register('description')}
                        />
                        {errors.description && <p className="text-[10px] font-bold text-danger ml-1">{errors.description.message}</p>}
                    </div>

                    <div className="border-t border-border/10 pt-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2 ml-1"><Truck className="h-4 w-4" /> Postes de vente associés</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                            {queues.map(q => (
                                <label key={q.queueId} className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer",
                                    watchedQueueIds.includes(q.queueId) ? "bg-primary/5 border-primary/20 text-primary" : "bg-white border-transparent hover:border-slate-200"
                                )}>
                                    <input
                                        type="checkbox"
                                        checked={watchedQueueIds.includes(q.queueId)}
                                        onChange={() => toggleQueue(q.queueId)}
                                        className="rounded border-primary/30 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-bold">{q.name}</span>
                                </label>
                            ))}
                            {queues.length === 0 && <span className="text-xs text-text-muted col-span-2 text-center py-4">Aucune file disponible. Créez des files d'abord.</span>}
                        </div>
                        <p className="text-[10px] font-bold text-text-muted mt-2 ml-1 italic opacity-70">Sélectionnez les files capables de traiter ce type de produit.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl px-6">Annuler</Button>
                        <Button type="submit" className="rounded-xl px-10 shadow-lg shadow-primary/20" disabled={!isValid || createCategory.isPending || updateCategory.isPending}>
                            {createCategory.isPending || updateCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {selectedCategory ? 'Enregistrer' : 'Créer la catégorie'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                variant="danger"
            />

            <BulkActionsToolbar 
                selectedCount={selectedCount}
                onDelete={handleBulkDelete}
                onActivate={() => handleBulkStatusChange(true)}
                onDeactivate={() => handleBulkStatusChange(false)}
                onClear={clearSelection}
                isLoading={bulkDeleteCategories.isPending || bulkUpdateCategoryStatus.isPending}
                label="catégories sélectionnées"
            />
        </div>
    );
};
