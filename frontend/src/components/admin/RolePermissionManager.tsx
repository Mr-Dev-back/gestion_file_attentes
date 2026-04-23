import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../molecules/ui/card';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Badge } from '../atoms/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../molecules/ui/tabs';
import { Modal, ConfirmModal } from '../molecules/ui/modal';
import { toast } from '../molecules/ui/toast';
import { 
    Shield, 
    Key, 
    Plus, 
    Trash2, 
    Edit2, 
    Search, 
    CheckSquare, 
    Square,
    ChevronRight,
    Lock,
    Layers
} from 'lucide-react';
import { useRoles } from '../../hooks/useRoles';
import { usePermissions } from '../../hooks/usePermissions';
import { cn } from '../../lib/utils';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roleSchema, permissionSchema } from '../../lib/validation';
import { BulkActionsToolbar } from '../molecules/BulkActionsToolbar';
import { ResourceManager } from './ResourceManager';
import { AdminSkeleton } from '../molecules/ui/admin-skeleton';
import { EmptyState } from '../molecules/ui/empty-state';
import { DataTable } from '../molecules/DataTable/DataTable';

export const RolePermissionManager = ({ defaultTab = 'roles' }: { defaultTab?: 'roles' | 'permissions' | 'resources' }) => {
    const { roles, createRole, updateRole, deleteRole } = useRoles();
    const { permissions, resources, actions, isLoading, createPermission, updatePermission, deletePermission, bulkDeletePermissions } = usePermissions();

    const [activeSubTab, setActiveSubTab] = useState(defaultTab);

    // Sync tab when navigating
    useEffect(() => {
        setActiveSubTab(defaultTab);
    }, [defaultTab]);
    
    // Matrix Lookup Optimization - O(1) Access
    const permissionMatrixMap = useMemo(() => {
        const map = new Map<string, string>(); // 'resourceId:actionId' -> 'permissionId'
        permissions.forEach(p => {
            if (p.resourceId && p.actionId) {
                map.set(`${p.resourceId}:${p.actionId}`, p.permissionId);
            }
        });
        return map;
    }, [permissions]);

    // Role Modal State
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);

    const {
        register: registerRole,
        handleSubmit: handleSubmitRole,
        reset: resetRole,
        watch: watchRole,
        setValue: setRoleValue,
        formState: { errors: roleErrors, isValid: isRoleValid }
    } = useForm({
        resolver: zodResolver(roleSchema),
        defaultValues: { name: '', description: '', scope: 'SITE', permissionIds: [] },
        mode: 'onChange'
    });
    const currentPermissionIds = watchRole('permissionIds') || [];

    // Permission Modal State
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState<any>(null);

    const {
        register: registerPermission,
        handleSubmit: handleSubmitPermission,
        reset: resetPermission,
        watch: watchPermission,
        formState: { errors: permErrors, isValid: isPermValid }
    } = useForm({
        resolver: zodResolver(permissionSchema),
        defaultValues: { resourceId: '', actionId: '', action: '', subject: '', conditions: '', description: '' },
        mode: 'onChange'
    });

    const [searchTerm, setSearchTerm] = useState('');

    // --- Role Actions ---
    const handleOpenRoleModal = (role: any = null) => {
        if (role) {
            setEditingRole(role);
            resetRole({
                name: role.name,
                description: role.description || '',
                scope: role.scope,
                permissionIds: role.permissions?.map((p: any) => p.permissionId) || []
            });
        } else {
            setEditingRole(null);
            resetRole({ name: '', description: '', scope: 'SITE', permissionIds: [] });
        }
        setIsRoleModalOpen(true);
    };

    const onSaveRole = async (data: any) => {
        try {
            if (editingRole) {
                await updateRole.mutateAsync({ id: editingRole.roleId, data });
                toast('Rôle mis à jour', 'success');
            } else {
                await createRole.mutateAsync(data);
                toast('Rôle créé', 'success');
            }
            setIsRoleModalOpen(false);
        } catch (error) {
            toast('Une erreur est survenue', 'error');
        }
    };

    const togglePermissionInRole = (pid: string) => {
        const currentIds = watchRole('permissionIds') || [];
        if (currentIds.includes(pid)) {
            setRoleValue('permissionIds', currentIds.filter(id => id !== pid), { shouldValidate: true, shouldDirty: true });
        } else {
            setRoleValue('permissionIds', [...currentIds, pid], { shouldValidate: true, shouldDirty: true });
        }
    };

    // --- Permission Actions ---
    const handleOpenPermissionModal = (perm: any = null) => {
        if (perm) {
            setEditingPermission(perm);
            resetPermission({
                description: perm.description || '',
                resourceId: perm.resourceId,
                actionId: perm.actionId,
                action: perm.action || '',
                subject: perm.subject || '',
                conditions: perm.conditions ? JSON.stringify(perm.conditions, null, 2) : ''
            });
        } else {
            setEditingPermission(null);
            resetPermission({ description: '', resourceId: '', actionId: '', action: '', subject: '', conditions: '' });
        }
        setIsPermissionModalOpen(true);
    };

    const onSavePermission = async (data: any) => {
        try {
            const payload = { ...data };
            // Conversion safely if it's a string
            if (payload.conditions && typeof payload.conditions === 'string') {
                try {
                    payload.conditions = JSON.parse(payload.conditions);
                } catch (e) {
                    toast('JSON invalide dans les conditions', 'error');
                    return;
                }
            }

            if (editingPermission) {
                await updatePermission.mutateAsync({ id: editingPermission.permissionId, data: payload });
                toast('Permission mise à jour', 'success');
            } else {
                await createPermission.mutateAsync(payload);
                toast('Permission créée', 'success');
            }
            setIsPermissionModalOpen(false);
        } catch (error) {
            toast('Une erreur est survenue', 'error');
        }
    };

    const filteredRoles = roles.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPermissions = permissions.filter(p => 
        (p.name || p.code).toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.resourceObj?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [permPage, setPermPage] = useState(1);
    const [permPageSize, setPermPageSize] = useState(10);

    const paginatedPermissions = filteredPermissions.slice(
        (permPage - 1) * permPageSize,
        permPage * permPageSize
    );

    const {
        selectedIds,
        selectedCount,
        isAllSelected,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected
    } = useBulkSelection(filteredPermissions.map(p => p.permissionId));

    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger';
    }>({
        isOpen: false, title: '', message: '', onConfirm: () => {}
    });

    const handleBulkDelete = () => {
        setConfirmState({
            isOpen: true,
            title: 'Suppression groupée',
            message: `Voulez-vous vraiment supprimer les ${selectedCount} permissions sélectionnées ?`,
            variant: 'danger',
            onConfirm: async () => {
                try {
                     await bulkDeletePermissions.mutateAsync(selectedIds);
                     clearSelection();
                } catch (error) {
                     console.error(error);
                } finally {
                     setConfirmState(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
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
        <div className="space-y-6">
            <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as any)}>
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-primary/5 p-1 rounded-xl">
                        <TabsTrigger value="roles" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold">
                            <Shield className="w-4 h-4 mr-2" /> Rôles
                        </TabsTrigger>
                        <TabsTrigger value="permissions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold">
                            <Key className="w-4 h-4 mr-2" /> Permissions
                        </TabsTrigger>
                        <TabsTrigger value="resources" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold text-primary">
                            <Layers className="w-4 h-4 mr-2" /> Ressources
                        </TabsTrigger>
                    </TabsList>

                    {activeSubTab !== 'resources' && (
                        <div className="flex items-center gap-4 animate-in fade-in duration-300">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <Input 
                                    placeholder="Rechercher..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-10 rounded-xl"
                                />
                            </div>
                            <Button 
                                onClick={() => activeSubTab === 'roles' ? handleOpenRoleModal() : handleOpenPermissionModal()}
                                className="rounded-xl shadow-lg shadow-primary/20"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Nouveau
                            </Button>
                        </div>
                    )}
                </div>

                <TabsContent value="roles" className="animate-in fade-in slide-in-from-bottom-2">
                    {filteredRoles.length === 0 ? (
                        <EmptyState 
                            icon={Shield} 
                            title="Aucun rôle" 
                            description="Aucun rôle n'a été trouvé. Les rôles définissent les accès que vous pouvez attribuer aux utilisateurs." 
                            actionLabel="Créer un rôle" 
                            onAction={() => handleOpenRoleModal()} 
                            className="bg-white rounded-2xl border border-slate-200/60 shadow-lg"
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRoles.map(role => (
                                <Card key={role.roleId} className="group hover:shadow-xl transition-all duration-300 border border-slate-200/60 bg-white rounded-2xl overflow-hidden flex flex-col">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" onClick={() => handleOpenRoleModal(role)} className="h-8 w-8 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></Button>
                                                <Button variant="ghost" size="sm" onClick={() => deleteRole.mutate(role.roleId)} className="h-8 w-8 rounded-lg text-danger hover:bg-danger/10"><Trash2 className="w-3.5 h-3.5" /></Button>
                                            </div>
                                        </div>
                                        <CardTitle className="mt-4 font-black text-xl flex items-center gap-2">
                                            {role.name}
                                            <Badge variant="outline" className="text-[10px] font-bold uppercase">{role.scope}</Badge>
                                        </CardTitle>
                                        <p className="text-sm text-text-muted line-clamp-2 mt-1">{role.description || 'Aucune description'}</p>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col pt-4">
                                        <div className="mt-auto pt-4 border-t border-white/20 flex items-center justify-between">
                                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                                                {role.permissions?.length || 0} permissions
                                            </span>
                                            <Button variant="link" size="sm" onClick={() => handleOpenRoleModal(role)} className="h-auto p-0 font-bold text-primary text-xs italic group/link">
                                                Gérer l'accès <ChevronRight className="w-3 h-3 ml-1 translate-x-0 group-hover/link:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="permissions" className="animate-in fade-in slide-in-from-bottom-2">
                    <Card className="border border-slate-200/60 shadow-lg bg-white rounded-2xl overflow-hidden p-6">
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
                                    cell: (permission: any) => (
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected(permission.permissionId)} 
                                            onChange={() => toggleSelect(permission.permissionId)} 
                                            className="rounded border-primary/30 h-5 w-5 accent-primary cursor-pointer transition-all hover:scale-110" 
                                        />
                                    )
                                },
                                {
                                    header: 'RESSOURCE',
                                    cell: (permission: any) => (
                                        <div className="flex flex-col">
                                            <span className="font-black text-xs uppercase tracking-tight">{permission.resourceObj?.name || 'N/A'}</span>
                                            <span className="text-[10px] text-text-muted font-mono">{permission.resourceObj?.slug}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'DOMAINE (ACTION:SUJET)',
                                    cell: (permission: any) => (
                                        <div className="flex flex-col">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 w-fit">
                                                {permission.action || '---'} : {permission.subject || '---'}
                                            </Badge>
                                            <span className="text-[10px] text-text-muted mt-1 italic">{permission.actionObj?.name}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'CONDITIONS',
                                    cell: (permission: any) => (
                                        permission.conditions ? (
                                            <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 font-mono text-[9px]">
                                                {JSON.stringify(permission.conditions).slice(0, 30)}...
                                            </Badge>
                                        ) : (
                                            <span className="text-[10px] text-slate-300">Aucune</span>
                                        )
                                    )
                                },
                                {
                                    header: 'CODE',
                                    cell: (permission: any) => (
                                            <div className="flex flex-col">
                                                <code className="bg-black/5 px-2 py-0.5 rounded text-xs font-mono w-fit">
                                                    {permission.name || permission.code}
                                                </code>
                                                <span className="text-[10px] text-text-muted mt-1">{permission.guardName || 'api'}</span>
                                            </div>
                                    )
                                },
                                {
                                    header: 'ACTIONS',
                                    className: 'text-right pr-6',
                                    cell: (permission: any) => (
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenPermissionModal(permission); }} className="h-8 w-8"><Edit2 className="w-4 h-4 text-text-muted" /></Button>
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deletePermission.mutate(permission.permissionId); }} className="h-8 w-8 text-danger hover:bg-danger/10"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    )
                                }
                            ]}
                            data={paginatedPermissions}
                            isLoading={false}
                            totalItems={filteredPermissions.length}
                            currentPage={permPage}
                            pageSize={permPageSize}
                            onPageChange={setPermPage}
                            onPageSizeChange={setPermPageSize}
                            emptyMessage={searchTerm ? "Aucune permission trouvée pour cette recherche." : "Aucune combinaison d'accès trouvée. Configurez vos ressources pour en générer de nouvelles."}
                            zebra={true}
                            stickyHeader={true}
                        />
                    </Card>
                </TabsContent>

                <TabsContent value="resources" className="animate-in fade-in slide-in-from-bottom-2">
                    <ResourceManager />
                </TabsContent>
            </Tabs>

            {/* --- ROLE MODAL CONTAINS THE MATRIX --- */}
            <Modal 
                isOpen={isRoleModalOpen} 
                onClose={() => setIsRoleModalOpen(false)} 
                title={editingRole ? `Sécurité du rôle: ${editingRole.name}` : "Nouveau rôle"}
                size="6xl"
            >
                <form onSubmit={handleSubmitRole(onSaveRole)} className="space-y-6 pt-4 pb-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-1 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-text-muted ml-1">Nom du rôle</label>
                                <Input 
                                    placeholder="E.g. AGENT_BASE" 
                                    {...registerRole('name')}
                                    className={cn("h-11 rounded-xl", roleErrors.name && "border-danger ring-danger/20")}
                                />
                                {roleErrors.name && <p className="text-danger text-xs mt-1 px-1">{roleErrors.name.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-text-muted ml-1">Portée (Scope)</label>
                                <select 
                                    className={cn("w-full h-11 px-3 bg-white border border-input rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", roleErrors.scope && "border-danger ring-danger/20")}
                                    {...registerRole('scope')}
                                >
                                    <option value="GLOBAL">GLOBAL</option>
                                    <option value="COMPANY">COMPANY</option>
                                    <option value="SITE">SITE</option>
                                </select>
                                {roleErrors.scope && <p className="text-danger text-xs mt-1 px-1">{roleErrors.scope.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-text-muted ml-1">Description</label>
                                <Input 
                                    placeholder="Rôles et responsabilités..." 
                                    {...registerRole('description')}
                                    className={cn("h-11 rounded-xl", roleErrors.description && "border-danger ring-danger/20")}
                                />
                                {roleErrors.description && <p className="text-danger text-xs mt-1 px-1">{roleErrors.description.message as string}</p>}
                            </div>
                        </div>

                        {/* --- PERMISSION MATRIX --- */}
                        <div className="col-span-1 md:col-span-2 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black uppercase text-text-muted ml-1 flex items-center gap-2">
                                    Matrice des Permissions <Lock className="w-3 h-3" />
                                </label>
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    {currentPermissionIds.length} activée(s)
                                </span>
                            </div>
                            
                            <div className="border rounded-2xl bg-slate-50 relative overflow-hidden flex flex-col max-h-[500px]">
                                <div className="overflow-auto scrollbar-hide">
                                    <table className="w-full border-collapse">
                                        <thead className="sticky top-0 z-20 bg-white shadow-sm">
                                            <tr>
                                                <th className="sticky left-0 z-30 bg-white p-3 text-left border-b border-r bg-slate-50 min-w-[200px]">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Services / Objets</span>
                                                </th>
                                                {actions.map(action => (
                                                    <th key={action.actionId} className="p-3 text-center border-b border-r min-w-[100px]">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-black uppercase tracking-tighter text-text-main leading-none">{action.name}</span>
                                                            <span className="text-[9px] text-text-muted font-bold mt-1 leading-none italic">{action.slug}</span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resources.map(resource => (
                                                <tr key={resource.resourceId} className="hover:bg-primary/5 transition-colors">
                                                    <td className="sticky left-0 z-10 p-3 bg-white border-b border-r font-black text-xs uppercase text-slate-700">
                                                        {resource.name}
                                                    </td>
                                                    {actions.map(action => {
                                                        const key = `${resource.resourceId}:${action.actionId}`;
                                                        const permId = permissionMatrixMap.get(key);
                                                        
                                                        return (
                                                            <td key={action.actionId} className="p-2 border-b border-r text-center align-middle">
                                                                {permId ? (
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => togglePermissionInRole(permId)}
                                                                        className={cn(
                                                                            "w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all",
                                                                            currentPermissionIds.includes(permId)
                                                                                ? "bg-primary text-white shadow-md scale-110"
                                                                                : "bg-white border border-slate-200 text-slate-300 hover:border-primary hover:text-primary"
                                                                        )}
                                                                    >
                                                                        {currentPermissionIds.includes(permId) 
                                                                            ? <CheckSquare className="w-4 h-4" /> 
                                                                            : <Square className="w-4 h-4" />
                                                                        }
                                                                    </button>
                                                                ) : (
                                                                    <div className="w-6 h-0.5 bg-slate-200 mx-auto rounded-full opacity-30" title="Non configuré" />
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <p className="text-[9px] text-text-muted italic px-1">
                                * Seules les combinaisons de permissions configurées en base de données apparaissent dans la matrice.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="outline" className="rounded-xl px-6" onClick={() => setIsRoleModalOpen(false)}>Annuler</Button>
                        <Button 
                            type="submit"
                            className="rounded-xl px-12 shadow-lg shadow-primary/20 font-black tracking-tight"
                            isLoading={createRole.isPending || updateRole.isPending}
                        >
                            Enregistrer le rôle
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* --- PERMISSION MODAL --- */}
            <Modal
                isOpen={isPermissionModalOpen}
                onClose={() => setIsPermissionModalOpen(false)}
                title={editingPermission ? `Modifier le droit: ${editingPermission.name || editingPermission.code}` : "Nouveau Droit Système"}
                size="lg"
            >
                <form onSubmit={handleSubmitPermission(onSavePermission)} className="space-y-6 pt-4 pb-2">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-text-muted ml-1">Ressource Cible</label>
                            <select 
                                className={cn("w-full h-11 px-3 bg-white border border-input rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", permErrors.resourceId && "border-danger ring-danger/20")}
                                {...registerPermission('resourceId')}
                            >
                                <option value="">-- Sélectionner un objet --</option>
                                {resources.map(r => (
                                    <option key={r.resourceId} value={r.resourceId}>{r.name} ({r.slug})</option>
                                ))}
                            </select>
                            {permErrors.resourceId && <p className="text-danger text-xs mt-1 px-1">{permErrors.resourceId.message as string}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-text-muted ml-1">Action Autorisée</label>
                            <select 
                                className={cn("w-full h-11 px-3 bg-white border border-input rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", permErrors.actionId && "border-danger ring-danger/20")}
                                {...registerPermission('actionId')}
                            >
                                <option value="">-- Sélectionner un verbe --</option>
                                {actions.map(a => (
                                    <option key={a.actionId} value={a.actionId}>{a.name} ({a.slug})</option>
                                ))}
                            </select>
                            {permErrors.actionId && <p className="text-danger text-xs mt-1 px-1">{permErrors.actionId.message as string}</p>}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-text-muted ml-1">Action CASL</label>
                            <Input 
                                placeholder="E.g. manage, read, create" 
                                {...registerPermission('action')}
                                className={cn("h-11 rounded-xl", permErrors.action && "border-danger")}
                            />
                            <p className="text-[9px] text-slate-400 italic px-1">* Verbe utilisé par le moteur CASL</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-text-muted ml-1">Sujet CASL</label>
                            <Input 
                                placeholder="E.g. Ticket, User, Site" 
                                {...registerPermission('subject')}
                                className={cn("h-11 rounded-xl", permErrors.subject && "border-danger")}
                            />
                            <p className="text-[9px] text-slate-400 italic px-1">* Nom de l'objet (PascalCase conseillé)</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-text-muted ml-1">Conditions Dynamiques (JSON)</label>
                        <textarea 
                            className={cn("w-full h-24 p-3 bg-slate-50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs", permErrors.conditions && "border-danger")}
                            placeholder='e.g. { "siteId": "${user.siteId}" }'
                            {...registerPermission('conditions')}
                        />
                        <p className="text-[9px] text-slate-400 italic px-1">* Supporte les placeholders: {"${user.siteId}"}, {"${user.assignedQueueIds}"}</p>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-text-muted ml-1">Description</label>
                        <Input 
                            placeholder="Pourquoi cette permission est nécessaire ?" 
                            {...registerPermission('description')}
                            className={cn("h-11 rounded-xl", permErrors.description && "border-danger ring-danger/20")}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="outline" className="rounded-xl px-6" onClick={() => setIsPermissionModalOpen(false)}>Annuler</Button>
                        <Button 
                            type="submit"
                            className="rounded-xl px-12 shadow-lg shadow-primary/20"
                            isLoading={createPermission.isPending || updatePermission.isPending}
                        >
                            Générer la Permission
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
                variant={confirmState.variant}
            />

            {activeSubTab === 'permissions' && (
                <BulkActionsToolbar 
                    selectedCount={selectedCount}
                    onDelete={handleBulkDelete}
                    onClear={clearSelection}
                    isLoading={bulkDeletePermissions.isPending}
                    label="permissions sélectionnées"
                />
            )}
        </div>
    );
};
