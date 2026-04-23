import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../molecules/ui/card';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Badge } from '../atoms/ui/badge';
import { Modal, ConfirmModal } from '../molecules/ui/modal';
import { toast } from 'sonner';
import { 
    Building2, 
    GitBranch, 
    MapPinned, 
    Plus, 
    Search, 
    Trash2, 
    Edit2,
    ToggleRight, 
    ToggleLeft 
} from 'lucide-react';
import { useCompanies } from '../../hooks/useCompanies';
import { useSites, type Site } from '../../hooks/useSites';
import { useWorkflows } from '../../hooks/useWorkflows';
import { cn } from '../../lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { SearchableSelect } from '../atoms/ui/SearchableSelect';
import { zodResolver } from '@hookform/resolvers/zod';
import { siteSchema } from '../../lib/validation';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActionsToolbar } from '../molecules/BulkActionsToolbar';
import { DataTable } from '../molecules/DataTable/DataTable';
import type { z } from 'zod';

type SiteFormValues = z.input<typeof siteSchema>;

export const SiteManager = () => {
    const { companies } = useCompanies();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');

    const { sites, total, createSite, updateSite, deleteSite, bulkDeleteSites, isLoading: isLoadingSites } = useSites({ page: currentPage, limit: pageSize, search });
    const { workflows } = useWorkflows();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSite, setEditingSite] = useState<Site | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isValid, isDirty }
    } = useForm<SiteFormValues>({
        resolver: zodResolver(siteSchema),
        defaultValues: {
            name: '',
            code: '',
            companyId: '',
            workflowId: '',
            isActive: true,
            isMonoUserProcess: false
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
    } = useBulkSelection(sites.map((site: Site) => site.siteId));

    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'warning' | 'primary';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const closeConfirm = () => setConfirmState(prev => ({ ...prev, isOpen: false }));

    const handleBulkDelete = () => {
        setConfirmState({
            isOpen: true,
            title: 'Suppression groupée',
            message: `Voulez-vous vraiment supprimer les ${selectedCount} sites sélectionnés ? Cette opération est irréversible.`,
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await bulkDeleteSites.mutateAsync(selectedIds);
                    clearSelection();
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const handleDelete = (id: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Confirmation de suppression',
            message: 'Voulez-vous vraiment supprimer ce site définitivement ? Toutes les données liées seront impactées.',
            variant: 'danger',
            onConfirm: () => {
                deleteSite.mutate(id, {
                    onSuccess: () => toast.success('Site supprimé'),
                    onError: () => toast.error('Erreur lors de la suppression')
                });
            }
        });
    };

    const handleOpenModal = (site: Site | null = null) => {
        setEditingSite(site);
        if (site) {
            reset({
                name: site.name,
                code: site.code || '',
                companyId: site.companyId,
                workflowId: site.workflowId || '',
                isActive: site.isActive ?? true,
                isMonoUserProcess: site.isMonoUserProcess ?? false
            });
        } else {
            reset({
                name: '',
                code: '',
                companyId: '',
                workflowId: '',
                isActive: true,
                isMonoUserProcess: false
            });
        }
        setIsModalOpen(true);
    };

    const onSave = (data: SiteFormValues) => {
        const cleanedData = {
            ...data,
            workflowId: data.workflowId === '' ? null : data.workflowId
        };
        const mutation = editingSite ? updateSite : createSite;
        const payload = editingSite ? { id: editingSite.siteId, data: cleanedData } : cleanedData;
        
        mutation.mutate(payload as any, {
            onSuccess: () => {
                setIsModalOpen(false);
                toast.success(editingSite ? 'Site mis à jour' : 'Site créé avec succès');
                setEditingSite(null);
            },
            onError: () => toast.error('Erreur lors de l\'opération')
        });
    };

    const columns = [
        {
            header: (
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        checked={isAllSelected} 
                        onChange={toggleSelectAll} 
                        className="rounded border-white/20 h-5 w-5 accent-primary cursor-pointer shadow-sm transition-all hover:scale-110" 
                    />
                </div>
            ),
            width: '60px',
            className: 'pl-6',
            cell: (site: any) => (
                <input 
                    type="checkbox" 
                    checked={isSelected(site.siteId)} 
                    onChange={() => toggleSelect(site.siteId)} 
                    className="rounded border-slate-300 h-5 w-5 accent-primary cursor-pointer transition-all hover:scale-110" 
                />
            )
        },
        {
            header: 'Nom du site',
            cell: (site: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{site.name}</span>
                </div>
            )
        },
        {
            header: 'Code',
            cell: (site: any) => (
                <Badge variant="outline" className="text-[10px] font-black border-slate-200 bg-slate-50 text-slate-500 tracking-wider">
                    {site.code}
                </Badge>
            )
        },
        {
            header: 'Société',
            cell: (site: any) => (
                <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary opacity-60" />
                    <span className="text-xs text-slate-700 font-bold uppercase tracking-tight">{site.company?.name || '---'}</span>
                </div>
            )
        },
        {
            header: 'Workflow',
            cell: (site: any) => (
                <div className="flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">{site.workflow?.name || '---'}</span>
                </div>
            )
        },
        {
            header: 'Statut',
            cell: (site: any) => (
                site.isActive ? (
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black uppercase tracking-widest px-3">Actif</Badge>
                ) : (
                    <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[9px] font-bold uppercase tracking-widest px-3">Inactif</Badge>
                )
            )
        },
        {
            header: 'Actions',
            className: 'text-right pr-6',
            cell: (site: any) => (
                <div className="flex justify-end gap-1">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(site); }} 
                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                        title="Modifier le site"
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); handleDelete(site.siteId); }} 
                        className="h-8 w-8 rounded-lg text-danger hover:bg-danger/10 transition-all"
                        title="Supprimer le site"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-slide-up">
            <Card className="border border-slate-200/60 shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between p-6 bg-white border-b border-slate-100">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <MapPinned className="h-5 w-5 text-primary" />
                            Gestion des Sites
                        </CardTitle>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">Configuration géographique et opérationnelle des sites</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={() => handleOpenModal()} className="rounded-xl shadow-lg shadow-primary/20 gap-2">
                            <Plus className="h-4 w-4" /> Nouveau Site
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/30">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <Input 
                                placeholder="Rechercher par nom, code ou société..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                className="pl-10 h-10 bg-white border-slate-200 rounded-xl text-sm" 
                            />
                        </div>
                    </div>
                    <div className="p-6">
                        <DataTable 
                            columns={columns}
                            data={sites}
                            isLoading={isLoadingSites}
                            totalItems={total}
                            currentPage={currentPage}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                            emptyMessage={search ? "Aucun site ne correspond à votre recherche." : "Vous n'avez pas encore de sites."}
                            zebra={true}
                            stickyHeader={true}
                        />
                    </div>
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSite ? "Modifier le Site" : "Nouveau Site"} isDirty={isDirty}>
                <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
                    <div>
                        <Controller
                            name="companyId"
                            control={control}
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Société de rattachement"
                                    placeholder="Choisir une société"
                                    options={companies.map(c => ({ value: c.companyId, label: c.name }))}
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        {errors.companyId && <p className="text-[10px] font-bold text-danger ml-1 mt-1">{errors.companyId.message}</p>}
                    </div>
                    <div>
                         <Controller
                            name="workflowId"
                            control={control}
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Workflow opérationnel"
                                    placeholder="Choisir un workflow"
                                    options={workflows.map(wf => ({ value: wf.workflowId, label: wf.name }))}
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Nom du site</label>
                            <Input placeholder="ex: SIBM Abidjan" {...register('name')} error={errors.name?.message} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Code unique</label>
                            <Input placeholder="ex: ABJ01" {...register('code')} error={errors.code?.message} />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 pt-2 px-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('isActive')} className="rounded accent-primary h-4 w-4" />
                            <span className="text-sm font-medium">Actif</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">Annuler</Button>
                        <Button type="submit" isLoading={createSite.isPending || updateSite.isPending} disabled={!isValid} className="rounded-xl font-bold px-6 shadow-lg shadow-primary/20">
                            {editingSite ? 'Mettre à jour' : 'Créer le site'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
            />

            <BulkActionsToolbar 
                selectedCount={selectedCount}
                onDelete={handleBulkDelete}
                onClear={clearSelection}
                isLoading={bulkDeleteSites.isPending}
                label="sites sélectionnés"
            />
        </div>
    );
};
