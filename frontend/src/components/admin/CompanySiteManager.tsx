import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../molecules/ui/card';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Badge } from '../atoms/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../molecules/ui/table';
import { Modal, ConfirmModal } from '../molecules/ui/modal';
import { toast } from '../molecules/ui/toast';
import { Building2, Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { useCompanies } from '../../hooks/useCompanies';
import { cn } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companySchema } from '../../lib/validation';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActionsToolbar } from '../molecules/BulkActionsToolbar';
import { AdminSkeleton } from '../molecules/ui/admin-skeleton';
import { EmptyState } from '../molecules/ui/empty-state';

export const CompanySiteManager = () => {
    const { companies, createCompany, updateCompany, deleteCompany, bulkDeleteCompanies } = useCompanies();

    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<any>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid, isDirty }
    } = useForm({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: '',
            code: '',
            description: '',
            isActive: true
        },
        mode: 'onChange'
    });

    const [companySearch, setCompanySearch] = useState('');

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

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(companySearch.toLowerCase())
    );

    const {
        selectedIds,
        selectedCount,
        isAllSelected,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected
    } = useBulkSelection(filteredCompanies.map(c => c.companyId));

    const handleDelete = (id: string, message: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Confirmation de suppression',
            message: message,
            variant: 'danger',
            onConfirm: () => {
                deleteCompany.mutate(id, {
                    onSuccess: () => toast('Suppression réussie', 'success'),
                    onError: () => toast('Erreur lors de la suppression', 'error')
                });
            }
        });
    };

    const handleBulkDelete = () => {
        setConfirmState({
            isOpen: true,
            title: 'Suppression groupée',
            message: `Supprimer les ${selectedCount} sociétés sélectionnées ainsi que leurs données rattachées ?`,
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await bulkDeleteCompanies.mutateAsync(selectedIds);
                    clearSelection();
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const handleOpenCompanyModal = (company: any = null) => {
        setEditingCompany(company);
        if (company) {
            reset({
                name: company.name,
                code: company.code || '',
                description: company.description || '',
                isActive: company.isActive ?? true
            });
        } else {
            reset({
                name: '',
                code: '',
                description: '',
                isActive: true
            });
        }
        setIsCompanyModalOpen(true);
    };

    const onSaveCompany = async (data: any) => {
        try {
            if (editingCompany) {
                await updateCompany.mutateAsync({ id: editingCompany.companyId, data });
                toast('Société mise à jour', 'success');
            } else {
                await createCompany.mutateAsync(data);
                toast('Société créée avec succès', 'success');
            }
            setIsCompanyModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6 animate-slide-up">
            <Card className="border border-slate-200/60 shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between p-6 bg-white border-b border-slate-100">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-primary" />
                            Gestion des Sociétés
                        </CardTitle>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">Entités juridiques du groupe et partenaires externes</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={() => handleOpenCompanyModal()} className="rounded-xl shadow-lg shadow-primary/20 gap-2">
                            <Plus className="h-4 w-4" /> Nouvelle Société
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/30">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <Input 
                                placeholder="Rechercher une société par nom..." 
                                value={companySearch} 
                                onChange={(e) => setCompanySearch(e.target.value)} 
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
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Nom</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Code</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Description</TableHead>
                                    <TableHead className="text-right pr-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCompanies.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="p-0 border-0 hover:bg-transparent">
                                            <EmptyState 
                                                icon={Building2} 
                                                title="Aucune société trouvée" 
                                                description={companySearch ? "Aucune société ne correspond à votre recherche." : "Vous n'avez pas encore configuré de sociétés. Ajoutez votre première entité juridique."} 
                                                actionLabel={!companySearch ? "Nouvelle Société" : undefined} 
                                                onAction={!companySearch ? () => handleOpenCompanyModal() : undefined} 
                                                className="py-16"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCompanies.map(company => (
                                    <TableRow 
                                        key={company.companyId} 
                                        className={cn(
                                            "group transition-all duration-200 border-white/5", 
                                            isSelected(company.companyId) 
                                                ? "bg-primary/10 border-l-4 border-l-primary shadow-sm" 
                                                : "hover:bg-slate-50/80 border-l-4 border-l-transparent"
                                        )}
                                    >
                                        <TableCell className="pl-6">
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected(company.companyId)} 
                                                onChange={() => toggleSelect(company.companyId)} 
                                                className="rounded border-primary/30 h-5 w-5 accent-primary cursor-pointer transition-all hover:scale-110" 
                                            />
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-700">{company.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-bold border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-tighter px-2">
                                                {company.code}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-text-muted italic max-w-[200px] truncate">
                                            {company.description || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleOpenCompanyModal(company)} 
                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleDelete(company.companyId, 'Supprimer cette société ?')} 
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

            <Modal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} title={editingCompany ? "Modifier la Société" : "Nouvelle Société"} isDirty={isDirty}>
                <form onSubmit={handleSubmit(onSaveCompany)} className="space-y-4 py-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Nom de la société</label>
                        <Input placeholder="ex: SIBM" {...register('name')} error={errors.name?.message} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Code unique</label>
                        <Input placeholder="ex: SIBM" {...register('code')} error={errors.code?.message} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Description</label>
                        <Input placeholder="Description de la société" {...register('description')} error={errors.description?.message} />
                    </div>
                    <div className="flex items-center gap-2 pt-2 px-1">
                        <input type="checkbox" {...register('isActive')} className="rounded accent-primary h-4 w-4" />
                        <label className="text-sm font-medium">Actif</label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => setIsCompanyModalOpen(false)} className="rounded-xl">Annuler</Button>
                        <Button type="submit" isLoading={createCompany.isPending || updateCompany.isPending} disabled={!isValid} className="rounded-xl font-bold px-6">
                            {editingCompany ? 'Mettre à jour' : 'Créer la société'}
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
                isLoading={bulkDeleteCompanies.isPending}
                label="sociétés sélectionnées"
            />
        </div>
    );
};
