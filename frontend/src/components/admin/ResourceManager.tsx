import { useState } from 'react';
import { Card } from '../molecules/ui/card';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Badge } from '../atoms/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../molecules/ui/table';
import { toast } from '../molecules/ui/toast';
import { ConfirmModal } from '../molecules/ui/modal';
import { 
    Search, 
    Plus, 
    Trash2, 
    Edit2, 
    Layers, 
    Clock, 
    ShieldCheck, 
    ArrowLeft,
    AlertCircle
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActionsToolbar } from '../molecules/BulkActionsToolbar';
import { ResourceModal } from './ResourceModal';
import { AdminSkeleton } from '../molecules/ui/admin-skeleton';
import { EmptyState } from '../molecules/ui/empty-state';
import { DataTable } from '../molecules/DataTable/DataTable';
import { cn } from '../../lib/utils';

interface ResourceManagerProps {
    onBack?: () => void;
}

export const ResourceManager = ({ onBack }: ResourceManagerProps) => {
    const { resources, isLoading, createResource, updateResource, deleteResource, bulkDeleteResources } = usePermissions();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; name: string }>({
        isOpen: false,
        id: '',
        name: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filteredResources = resources.filter(res => 
        res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedResources = filteredResources.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const {
        selectedIds,
        selectedCount,
        isAllSelected,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected
    } = useBulkSelection(filteredResources.map(r => r.resourceId));

    const handleOpenModal = (res: any = null) => {
        setEditingResource(res);
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        try {
            if (editingResource) {
                await updateResource.mutateAsync({ id: editingResource.resourceId, data });
                toast('Ressource mise à jour', 'success');
            } else {
                await createResource.mutateAsync(data);
                toast('Ressource créée avec succès (Permissions générées)', 'success');
            }
            setIsModalOpen(false);
        } catch (error: any) {
            toast(error.response?.data?.error || 'Une erreur est survenue', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteResource.mutateAsync(confirmDelete.id);
            toast('Ressource supprimée', 'success');
            setConfirmDelete({ isOpen: false, id: '', name: '' });
        } catch (error: any) {
            toast(error.response?.data?.error || 'Erreur lors de la suppression', 'error');
        }
    };

    const handleBulkDelete = () => {
        setConfirmDelete({
            isOpen: true,
            id: 'BULK',
            name: `${selectedCount} ressources`
        });
    };

    const onConfirmDelete = async () => {
        if (confirmDelete.id === 'BULK') {
            try {
                await bulkDeleteResources.mutateAsync(selectedIds);
                clearSelection();
                setConfirmDelete({ isOpen: false, id: '', name: '' });
            } catch (error: any) {
                toast(error.response?.data?.error || 'Erreur lors de la suppression groupée', 'error');
            }
        } else {
            handleDelete();
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="w-64 h-8 bg-slate-200/50 animate-pulse rounded-lg" />
                    <div className="w-32 h-8 bg-slate-200/50 animate-pulse rounded-lg" />
                </div>
                <AdminSkeleton variant="table" count={8} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <Button variant="ghost" onClick={onBack} className="rounded-xl h-10 w-10 p-0 hover:bg-slate-100">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-3">
                            <Layers className="w-6 h-6 text-primary" />
                            Gestion des Ressources
                        </h2>
                        <p className="text-xs text-text-muted font-bold tracking-tight">Configurez les objets du système et leurs droits d'accès</p>
                    </div>
                </div>
                <Button onClick={() => handleOpenModal()} className="rounded-xl shadow-lg shadow-primary/20 gap-2">
                    <Plus className="w-4 h-4" /> Nouvelle Ressource
                </Button>
            </div>

            <Card className="border border-slate-200/60 shadow-lg bg-white rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
                    <div className="relative flex-1 max-w-md ml-auto">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <Input 
                            placeholder="Rechercher par nom ou slug..." 
                            value={searchTerm} 
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="h-10 pl-10 rounded-xl bg-white border-slate-200"
                        />
                    </div>
                </div>

                <div className="p-6">
                    <DataTable 
                        columns={[
                            {
                                header: (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            checked={isAllSelected} 
                                            onChange={toggleSelectAll}
                                            className="rounded border-primary/40 h-5 w-5 accent-primary cursor-pointer shadow-sm transition-all hover:scale-110"
                                        />
                                    </div>
                                ),
                                width: '60px',
                                className: 'pl-6',
                                cell: (res: any) => (
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected(res.resourceId)} 
                                        onChange={() => toggleSelect(res.resourceId)}
                                        className="rounded border-primary/30 h-5 w-5 accent-primary cursor-pointer transition-all hover:scale-110"
                                    />
                                )
                            },
                            {
                                header: 'Ressource',
                                cell: (res: any) => <span className="font-black text-slate-700">{res.name}</span>
                            },
                            {
                                header: 'Identifiant (Slug)',
                                cell: (res: any) => (
                                    <code className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-tight">
                                        {res.slug}
                                    </code>
                                )
                            },
                            {
                                header: 'Permissions',
                                className: 'text-center',
                                cell: (res: any) => (
                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black">
                                        <ShieldCheck className="w-3 h-3 mr-1.5 opacity-70" />
                                        {res.permissionCount || 0}
                                    </Badge>
                                )
                            },
                            {
                                header: 'Description',
                                cell: (res: any) => (
                                    <div className="max-w-xs">
                                        <p className="text-xs text-text-muted line-clamp-1 italic">{res.description || 'N/A'}</p>
                                    </div>
                                )
                            },
                            {
                                header: 'Actions',
                                className: 'text-right pr-6',
                                cell: (res: any) => (
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={(e) => { e.stopPropagation(); handleOpenModal(res); }}
                                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={(e) => { e.stopPropagation(); setConfirmDelete({ isOpen: true, id: res.resourceId, name: res.name }); }}
                                            className="h-8 w-8 rounded-lg text-danger hover:bg-danger/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )
                            }
                        ]}
                        data={paginatedResources}
                        isLoading={false}
                        totalItems={filteredResources.length}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        emptyMessage={searchTerm ? "Aucune ressource ne correspond à votre recherche." : "Vous n'avez pas encore défini de ressources système (objets)."}
                        zebra={true}
                        stickyHeader={true}
                    />
                </div>
            </Card>

            {/* Documentation Alert */}
            <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl flex gap-4 items-start">
                <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                    <Clock className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-black text-blue-800 text-sm mb-1 uppercase tracking-tight">Note de Configuration</h4>
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                        Les ressources définies ici sont les piliers de votre système de sécurité. Une fois créées, elles 
                        permettent de contrôler précisément qui peut accéder à quoi. L'auto-génération crée par défaut 
                        toutes les actions scalables (READ, CREATE, UPDATE, DELETE).
                    </p>
                </div>
            </div>

            <ResourceModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                editingResource={editingResource}
                isPending={createResource.isPending || updateResource.isPending}
            />

            <ConfirmModal 
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
                onConfirm={onConfirmDelete}
                title={confirmDelete.id === 'BULK' ? 'Suppression groupée' : 'Supprimer la ressource ?'}
                message={confirmDelete.id === 'BULK' 
                    ? `Voulez-vous vraiment supprimer ces ${selectedCount} ressources ? Cette action est irréversible et d'autres entités liées pourraient être affectées.` 
                    : `Voulez-vous vraiment supprimer "${confirmDelete.name}" ? Cela supprimera également toutes les permissions rattachées non utilisées.`
                }
                variant="danger"
            />

            <BulkActionsToolbar 
                selectedCount={selectedCount}
                onDelete={handleBulkDelete}
                onClear={clearSelection}
                isLoading={bulkDeleteResources.isPending}
                label="ressources sélectionnées"
            />
        </div>
    );
};
