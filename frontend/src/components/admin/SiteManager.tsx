import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../molecules/ui/card';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Badge } from '../atoms/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../molecules/ui/table';
import { Modal, ConfirmModal } from '../molecules/ui/modal';
import { toast } from '../molecules/ui/toast';
import { MapPinned, Plus, Search, Trash2, Edit2, Building2, GitBranch } from 'lucide-react';
import { useCompanies } from '../../hooks/useCompanies';
import { useSites } from '../../hooks/useSites';
import { useWorkflows } from '../../hooks/useWorkflows';
import { cn } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { siteSchema } from '../../lib/validation';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActionsToolbar } from '../molecules/BulkActionsToolbar';
import { EmptyState } from '../molecules/ui/empty-state';

export const SiteManager = () => {
    const { companies } = useCompanies();
    const { sites, createSite, updateSite, deleteSite, bulkDeleteSites } = useSites();
    const { workflows } = useWorkflows();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSite, setEditingSite] = useState<any>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid, isDirty }
    } = useForm({
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

    const [search, setSearch] = useState('');

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

    const filteredSites = sites.filter(site =>
        site.name.toLowerCase().includes(search.toLowerCase()) ||
        site.code?.toLowerCase().includes(search.toLowerCase()) ||
        site.company?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const {
        selectedIds,
        selectedCount,
        isAllSelected,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected
    } = useBulkSelection(filteredSites.map(s => s.siteId));

    const handleBulkDelete = () => {
        setConfirmState({
            isOpen: true,
            title: 'Suppression groupée',
            message: `Voulez-vous vraiment supprimer les ${selectedCount} sites sélectionnés ? Cette opération est irréversible.🎉`,
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
            title: 'Confirmation',
            message: 'Supprimer ce site définitivement ?',
            variant: 'danger',
            onConfirm: () => {
                deleteSite.mutate(id, {
                    onSuccess: () => toast('Site supprimé', 'success'),
                    onError: () => toast('Erreur lors de la suppression', 'error')
                });
            }
        });
    };

    const handleOpenModal = (site: any = null) => {
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

    const onSave = (data: any) => {
        const cleanedData = {
            ...data,
            workflowId: data.workflowId === '' ? null : data.workflowId
        };
        const mutation = editingSite ? updateSite : createSite;
        const payload = editingSite ? { id: editingSite.siteId, data: cleanedData } : cleanedData;
        
        mutation.mutate(payload as any, {
            onSuccess: () => {
                setIsModalOpen(false);
                toast(editingSite ? 'Site mis à jour' : 'Site créé avec succès', 'success');
                setEditingSite(null);
            },
            onError: () => toast('Erreur lors de l\'opération', 'error')
        });
    };

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
                    <div className="overflow-x-auto">
                        <Table stickyHeader maxHeight="60vh">
                            <TableHeader sticky>
                                <TableRow className="bg-slate-50/50 hover:bg-transparent">
                                    <TableHead className="w-[50px] pl-6">
                                        <input 
                                            type="checkbox" 
                                            checked={isAllSelected} 
                                            onChange={toggleSelectAll} 
                                            className="rounded border-primary/40 h-5 w-5 accent-primary cursor-pointer shadow-sm transition-all hover:scale-110" 
                                        />
                                    </TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Site</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Code</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Société</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Workflow</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Statut</TableHead>
                                    <TableHead className="text-right pr-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSites.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="p-0 border-0 hover:bg-transparent">
                                            <EmptyState 
                                                icon={MapPinned} 
                                                title="Aucun site trouvé" 
                                                description={search ? "Aucun site ne correspond à votre recherche." : "Vous n'avez pas encore configuré de sites rattachés à vos sociétés."} 
                                                actionLabel={!search ? "Nouveau Site" : undefined} 
                                                onAction={!search ? () => handleOpenModal() : undefined} 
                                                className="py-16"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredSites.map(site => (
                                    <TableRow 
                                        key={site.siteId} 
                                        className={cn(
                                            "group transition-all duration-200 border-white/5", 
                                            isSelected(site.siteId) 
                                                ? "bg-primary/10 border-l-4 border-l-primary shadow-sm" 
                                                : "hover:bg-slate-50/80 border-l-4 border-l-transparent"
                                        )}
                                    >
                                        <TableCell className="pl-6">
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected(site.siteId)} 
                                                onChange={() => toggleSelect(site.siteId)} 
                                                className="rounded border-primary/30 h-5 w-5 accent-primary cursor-pointer transition-all hover:scale-110" 
                                            />
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-700">{site.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-bold border-slate-200 bg-slate-50 text-slate-600">
                                                {site.code}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="h-3.5 w-3.5 text-primary opacity-60" />
                                                <span className="text-xs text-text-muted font-bold uppercase tracking-tight">{site.company?.name || '---'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <GitBranch className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-xs text-text-muted font-medium">{site.workflow?.name || '---'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {site.isActive ? (
                                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-black uppercase">Actif</Badge>
                                            ) : (
                                                <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[10px] font-bold uppercase">Inactif</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleOpenModal(site)} 
                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleDelete(site.siteId)} 
                                                    className="h-8 w-8 rounded-lg text-danger hover:bg-danger/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSite ? "Modifier le Site" : "Nouveau Site"} isDirty={isDirty}>
                <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Société de rattachement</label>
                        <select 
                            className={cn(
                                "w-full p-2.5 border rounded-xl text-sm outline-none bg-white transition-all",
                                errors.companyId ? "border-danger focus:ring-danger/20" : "focus:border-primary/50"
                            )}
                            {...register('companyId')}
                        >
                            <option value="">-- Sélectionner une Société --</option>
                            {companies.map(c => <option key={c.companyId} value={c.companyId}>{c.name}</option>)}
                        </select>
                        {errors.companyId && <p className="text-[10px] font-bold text-danger ml-1 mt-1">{errors.companyId.message}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Workflow opérationnel</label>
                        <select 
                            className="w-full p-2.5 border rounded-xl text-sm outline-none bg-white focus:border-primary/50"
                            {...register('workflowId')}
                        >
                            <option value="">-- Sélectionner un Workflow --</option>
                            {workflows.map(wf => <option key={wf.workflowId} value={wf.workflowId}>{wf.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Nom du site</label>
                            <Input placeholder="ex: SIBM Abidjan" {...register('name')} error={errors.name?.message} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Code unique</label>
                            <Input placeholder="ex: ABJ-01" {...register('code')} error={errors.code?.message} />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 pt-2 px-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" {...register('isActive')} className="rounded accent-primary h-4 w-4" />
                            <span className="text-sm font-medium">Actif</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">Annuler</Button>
                        <Button type="submit" isLoading={createSite.isPending || updateSite.isPending} disabled={!isValid} className="rounded-xl font-bold px-6">
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
