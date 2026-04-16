import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../molecules/ui/card';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Badge } from '../atoms/ui/badge';
import { Modal, ConfirmModal } from '../molecules/ui/modal';
import { toast } from 'sonner';
import { 
    UserPlus, 
    Search, 
    Trash2, 
    Edit2, 
    Lock, 
    Smartphone, 
    ToggleRight, 
    ToggleLeft, 
    Shield, 
    Loader2, 
    LogOut,
    Check,
    Layers,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { Can, useAbility } from '../../auth/AbilityContext';
import { useUsers } from '../../hooks/useUsers';
import { useRoles } from '../../hooks/useRoles';
import { useCompanies } from '../../hooks/useCompanies';
import { useSites } from '../../hooks/useSites';
import { useQueues } from '../../hooks/useQueues';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActionsToolbar } from '../molecules/BulkActionsToolbar';
import { AdminSkeleton } from '../molecules/ui/admin-skeleton';
import { EmptyState } from '../molecules/ui/empty-state';
import { cn } from '../../lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from '../../lib/validation';
import { SearchableSelect } from '../atoms/ui/SearchableSelect';

import { DataTable } from '../molecules/DataTable/DataTable';

export const UserManager = () => {
    const ability = useAbility();
    const { 
        users, 
        isLoading: isLoadingUsers, 
        createUser, 
        updateUser, 
        deleteUser, 
        toggleActive, 
        unlockUser, 
        getUserSessions, 
        revokeSession,
        bulkDeleteUsers,
        bulkUpdateStatus
    } = useUsers();
    const { roles } = useRoles();
    const { companies } = useCompanies();
    const { sites } = useSites();
    const { queues } = useQueues();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        control,
        formState: { errors, isValid, isDirty }
    } = useForm({
        resolver: zodResolver(userSchema),
        defaultValues: {
            username: '',
            email: '',
            password: '',
            role: 'MANAGER' as any,
            siteId: '',
            companyId: '',
            queueId: '',
            queueIds: [] as string[],
            firstName: '',
            lastName: '',
            isActive: true
        },
        mode: 'onChange'
    });

    const watchedRole = watch('role');
    const watchedQueueIds = watch('queueIds') || [];
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    
    const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
    const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
    const [queueSearch, setQueueSearch] = useState('');
    const [sessionsUser, setSessionsUser] = useState<any>(null);
    const [activeSessions, setActiveSessions] = useState<any[]>([]);
    
    const [userSearch, setUserSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
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

    const filteredUsers = useMemo(() => 
        users.filter(user =>
            (user.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
            (user.firstName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
            (user.lastName || '').toLowerCase().includes(userSearch.toLowerCase())
        ),
        [users, userSearch]
    );

    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, currentPage, pageSize]);

    const {
        selectedIds,
        selectedCount,
        isAllSelected,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected
    } = useBulkSelection(filteredUsers.map(u => u.userId));

    const columns = [
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
            cell: (user: any) => (
                <input 
                    type="checkbox" 
                    checked={isSelected(user.userId)}
                    onChange={() => toggleSelect(user.userId)}
                    className="h-5 w-5 rounded border-primary/30 text-primary focus:ring-primary cursor-pointer transition-all hover:scale-110"
                />
            )
        },
        {
            header: 'Collaborateur',
            cell: (user: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-base">
                        {user.firstName || user.lastName 
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : user.username}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter opacity-70">@{user.username}</span>
                        <span className="text-[10px] text-primary/40">•</span>
                        <span className="text-xs text-slate-500 font-medium">{user.email}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Rôle & Structure',
            cell: (user: any) => (
                <div className="flex flex-col gap-1.5">
                    <Badge variant="outline" className="w-fit text-[10px] font-black uppercase tracking-widest border-slate-200 bg-white shadow-sm py-0.5 px-2">
                        <Shield className="h-3 w-3 mr-1.5 text-primary opacity-70" />
                        {roles.find(r => r.name === user.role)?.name || user.role}
                    </Badge>
                    <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {user.role === 'ADMINISTRATOR' && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Accès global au système</span>}
                        {user.role === 'MANAGER' && <Badge className="bg-primary/10 text-primary border-primary/10 text-[9px] font-bold">{user.company?.name || 'Société Inconnue'}</Badge>}
                        {(user.role === 'SUPERVISOR' || user.role === 'AGENT_GUERITE') && <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] font-bold">{user.site?.name || 'Site Inconnu'}</Badge>}
                        {user.role === 'AGENT_QUAI' && (
                            (user.queues && user.queues.length > 0) ? (
                                user.queues.map(q => <Badge key={q.queueId} className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-bold">{q.name}</Badge>)
                            ) : (
                                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Aucune file affectée</span>
                            )
                        )}
                    </div>
                </div>
            )
        },
        {
            header: 'Statut',
            cell: (user: any) => (
                <Badge variant={user.isActive ? 'success' : 'secondary'} className="text-[10px] font-black uppercase tracking-widest px-3">
                    {user.isActive ? 'Actif' : 'Inactif'}
                </Badge>
            )
        },
        {
            header: 'Dernière Connexion',
            cell: (user: any) => (
                <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-bold">
                        {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'dd/MM HH:mm') : 'Jamais'}
                    </span>
                </div>
            )
        },
        {
            header: 'Actions',
            className: 'text-right pr-6',
            cell: (user: any) => (
                <div className="flex items-center justify-end gap-1">
                    <Can I="update" a="User">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); toggleActive.mutate({ id: user.userId, isActive: !user.isActive }); }} 
                            className="h-9 w-9"
                            title={user.isActive ? "Désactiver" : "Activer"}
                        >
                            {user.isActive ? <ToggleRight className="h-5 w-5 text-success" /> : <ToggleLeft className="h-5 w-5 text-slate-300" />}
                        </Button>
                        {user.lockUntil && new Date(user.lockUntil) > new Date() && (
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleUnlockUser(user); }} className="h-9 w-9 text-warning" title="Débloquer le compte">
                                <Lock className="h-4.5 w-4.5" />
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenSessions(user); }} className="h-9 w-9 text-blue-500" title="Sessions actives">
                            <Smartphone className="h-4.5 w-4.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenUserModal(user); }} className="h-9 w-9 text-slate-500" title="Modifier">
                            <Edit2 className="h-4.5 w-4.5" />
                        </Button>
                    </Can>
                    <Can I="delete" a="User">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(user.userId, deleteUser, 'Voulez-vous vraiment supprimer cet utilisateur ?'); }} className="h-9 w-9 text-danger" title="Supprimer">
                            <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                    </Can>
                </div>
            )
        }
    ];

    const handleBulkDeleteUsers = () => {
        setConfirmState({
            isOpen: true,
            title: 'Suppression groupée',
            message: `Voulez-vous vraiment supprimer les ${selectedCount} utilisateurs sélectionnés ? Cette action est irréversible et d'autres entités liées pourraient être affectées.`,
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await bulkDeleteUsers.mutateAsync(selectedIds);
                    clearSelection();
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const handleBulkToggleUsers = async (isActive: boolean) => {
        const action = isActive ? 'activer' : 'désactiver';
        setConfirmState({
            isOpen: true,
            title: `${isActive ? 'Activation' : 'Désactivation'} groupée`,
            message: `Voulez-vous vraiment ${action} les ${selectedCount} utilisateurs sélectionnés ?`,
            onConfirm: async () => {
                try {
                    await bulkUpdateStatus.mutateAsync({ ids: selectedIds, isActive });
                    clearSelection();
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const handleUnlockUser = (user: any) => {
        setConfirmState({
            isOpen: true,
            title: 'Débloquer l\'utilisateur',
            message: `Voulez-vous débloquer l'utilisateur ${user.username} ?`,
            onConfirm: () => {
                unlockUser.mutate(user.userId, {
                    onSuccess: () => toast('Utilisateur débloqué avec succès', 'success'),
                    onError: () => toast('Erreur lors du déblocage', 'error')
                });
            },
            variant: 'primary'
        });
    };

    const handleOpenSessions = async (user: any) => {
        setSessionsUser(user);
        setIsSessionsModalOpen(true);
        setActiveSessions([]);
        try {
            const sessions = await getUserSessions(user.userId);
            setActiveSessions(sessions);
        } catch (error) {
            console.error("Failed to load sessions", error);
        }
    };

    const handleRevokeSession = (sessionId: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Révoquer la session',
            message: 'Voulez-vous vraiment déconnecter cet appareil à distance ?',
            variant: 'danger',
            onConfirm: () => {
                revokeSession.mutate(sessionId, {
                    onSuccess: () => {
                        setActiveSessions(prev => prev.filter(s => s.sessionId !== sessionId));
                    }
                });
            }
        });
    };

    const handleOpenUserModal = (user: any = null) => {
        if (user) {
            setEditingUser(user);
            reset({ 
                username: user.username, 
                email: user.email, 
                password: '', 
                role: user.role, 
                siteId: user.siteId || '',
                companyId: user.companyId || '',
                queueId: user.queueId || '',
                queueIds: user.queues?.map((q: any) => q.queueId) || [],
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                isActive: user.isActive ?? true
            });
        } else {
            setEditingUser(null);
            reset({ 
                username: '', 
                email: '', 
                password: '', 
                role: 'MANAGER', 
                siteId: '', 
                companyId: '', 
                queueId: '',
                queueIds: [],
                firstName: '',
                lastName: '',
                isActive: true
            });
        }
        setIsUserModalOpen(true);
    };

    const toggleQueue = (qid: string) => {
        const current = watchedQueueIds;
        const next = current.includes(qid)
            ? current.filter(id => id !== qid)
            : [...current, qid];
        setValue('queueIds', next, { shouldValidate: true });
        setValue('queueId', next.length > 0 ? next[0] : '', { shouldValidate: true });
    };

    const onSaveUser = (data: any) => {
        const payload: any = { ...data };
        
        if (payload.role === 'ADMINISTRATOR') {
            payload.siteId = null; payload.companyId = null; payload.queueIds = []; payload.queueId = null;
        } else if (payload.role === 'MANAGER') {
            payload.siteId = null; payload.queueIds = []; payload.queueId = null;
        } else if (payload.role === 'SUPERVISOR' || payload.role === 'AGENT_GUERITE') {
            payload.companyId = null; payload.queueIds = []; payload.queueId = null;
        } else if (payload.role === 'AGENT_QUAI') {
            payload.siteId = null; payload.companyId = null;
        }

        if (payload.password === '') delete payload.password;

        if (editingUser) {
            updateUser.mutate({ id: editingUser.userId, data: payload } as any, {
                onSuccess: () => setIsUserModalOpen(false)
            });
        } else {
            createUser.mutate(payload as any, {
                onSuccess: () => setIsUserModalOpen(false)
            });
        }
    };

    const handleDelete = (id: string, mutation: any, message: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Confirmation de suppression',
            message: message,
            variant: 'danger',
            onConfirm: () => {
                mutation.mutate(id, {
                    onSuccess: () => toast('Suppression réussie', 'success'),
                    onError: () => toast('Erreur lors de la suppression', 'error')
                });
            }
        });
    };

    return (
        <div className="space-y-4 animate-slide-up">
            <Card className="border border-slate-200/60 shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 p-8 border-b border-white/10 bg-white/30">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-2xl font-black flex items-center gap-3"><span className="w-2 h-8 bg-primary rounded-full"></span>Gestion des Comptes</CardTitle>
                        <p className="text-sm text-text-muted font-medium ml-5">Gérez les accès et les rôles des utilisateurs</p>
                    </div>
                    <Can I="create" a="User">
                        <Button onClick={() => handleOpenUserModal()} className="gap-2 rounded-xl shadow-lg shadow-primary/20"><UserPlus className="h-4 w-4" />Nouvel Utilisateur</Button>
                    </Can>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-6 border-b border-white/10 bg-white/20">
                        <div className="relative max-w-md group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                            <Input placeholder="Rechercher un utilisateur (nom, email)..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-10 h-10 bg-white/50 border-white/40 focus:bg-white rounded-xl shadow-sm" />
                        </div>
                    </div>
                    {isLoadingUsers ? <div className="p-6"><AdminSkeleton variant="table" count={10} /></div> : (
                        <div className="p-6">
                            <DataTable
                                columns={columns}
                                data={paginatedUsers}
                                isLoading={isLoadingUsers}
                                totalItems={filteredUsers.length}
                                currentPage={currentPage}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={setPageSize}
                                emptyMessage={userSearch ? "Aucun utilisateur ne correspond à votre recherche." : "Vous n'avez pas encore d'utilisateurs."}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal size="lg" isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUser ? `Modifier: ${editingUser.username}` : "Nouveau Collaborateur"} isDirty={isDirty}>
                <form onSubmit={handleSubmit(onSaveUser)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Prénom</label>
                            <Input placeholder="Prénom" {...register('firstName')} error={errors.firstName?.message} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nom</label>
                            <Input placeholder="Nom" {...register('lastName')} error={errors.lastName?.message} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nom d'utilisateur</label>
                            <Input placeholder="Identifiant" {...register('username')} error={errors.username?.message} />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email professionnel</label>
                            <Input placeholder="Email" type="email" {...register('email')} error={errors.email?.message} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{editingUser ? "Modifier le mot de passe (optionnel)" : "Mot de passe"}</label>
                        <Input placeholder="Mot de passe" type="password" {...register('password')} error={errors.password?.message} />
                    </div>

                    <div className="space-y-1">
                        <Controller
                            name="role"
                            control={control}
                            render={({ field }) => (
                                <SearchableSelect
                                    label="Rôle Système"
                                    placeholder="Choisir un rôle"
                                    options={roles.map(r => ({ value: r.name, label: r.name }))}
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        {errors.role && <p className="text-[10px] font-bold text-danger ml-1">{errors.role.message}</p>}
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex-1">
                            <p className="text-xs font-bold text-slate-700">Compte Actif</p>
                            <p className="text-[10px] text-slate-400 font-medium">L'utilisateur peut se connecter au système</p>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setValue('isActive', !watch('isActive'), { shouldDirty: true })}
                            className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-primary/5 shadow-inner",
                                watch('isActive') ? "bg-primary" : "bg-slate-200"
                            )}
                        >
                            <span className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md",
                                watch('isActive') ? "translate-x-6" : "translate-x-1"
                            )} />
                        </button>
                    </div>

                    {watchedRole === 'MANAGER' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Controller
                                name="companyId"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelect
                                        label="Société de rattachement"
                                        placeholder="Choisir une société"
                                        options={companies.map(c => ({ value: c.companyId, label: c.name }))}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            {errors.companyId && <p className="text-[10px] font-bold text-danger ml-1">{errors.companyId.message}</p>}
                        </div>
                    )}

                    {(watchedRole === 'SUPERVISOR' || watchedRole === 'AGENT_GUERITE') && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                             <Controller
                                name="siteId"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelect
                                        label="Site de rattachement"
                                        placeholder="Choisir un site"
                                        options={sites.map(s => ({ value: s.siteId, label: s.name }))}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            {errors.siteId && <p className="text-[10px] font-bold text-danger ml-1">{errors.siteId.message}</p>}
                        </div>
                    )}

                    {watchedRole === 'AGENT_QUAI' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 border-t pt-4 border-slate-50">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all cursor-pointer" onClick={() => setIsQueueModalOpen(true)}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                        <Layers className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Affectation des Files</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Définissez les files gérées par l'agent</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded-full">{watchedQueueIds.length} file(s)</span>
                                        <span className="text-[9px] text-slate-300 font-bold uppercase mt-0.5">Assignée(s)</span>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-primary font-bold text-[10px] uppercase tracking-wider bg-white shadow-sm border border-slate-200">
                                        Gérer
                                    </Button>
                                </div>
                            </div>
                            {errors.queueIds && <p className="text-[10px] font-bold text-danger ml-1">{errors.queueIds.message}</p>}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6">
                        <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)} className="rounded-xl px-6">Annuler</Button>
                        <Button type="submit" className="rounded-xl px-10 shadow-lg shadow-primary/20" disabled={!isValid || createUser.isPending || updateUser.isPending}>
                            {createUser.isPending || updateUser.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {editingUser ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isSessionsModalOpen} onClose={() => setIsSessionsModalOpen(false)} title={`Sessions Actives: ${sessionsUser?.username}`}>
                <div className="space-y-4">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Appareils et navigateurs connectés</p>
                    <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                        {activeSessions.map((session) => (
                            <div key={session.sessionId} className="flex items-center justify-between p-4 bg-white/40 border border-white/60 rounded-2xl group hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                        <Smartphone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-text-main line-clamp-1">{session.userAgent || 'Appareil inconnu'}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[10px] py-0">{session.ipAddress}</Badge>
                                            <span className="text-[10px] text-text-muted font-medium italic">Dernier accès: {new Date(session.updatedAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRevokeSession(session.sessionId)}
                                    className="h-9 w-9 text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Révoquer la session"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isQueueModalOpen} onClose={() => setIsQueueModalOpen(false)} title="Affectation des Files d'Attente" size="md">
                <div className="space-y-4 py-2">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                        <Input 
                            placeholder="Rechercher une file..." 
                            value={queueSearch} 
                            onChange={(e) => setQueueSearch(e.target.value)} 
                            className="pl-10 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white rounded-xl" 
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-1.5 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                        {queues
                            .filter(q => q.name.toLowerCase().includes(queueSearch.toLowerCase()))
                            .map(q => {
                                const isSelectedRow = watchedQueueIds.includes(q.queueId);
                                return (
                                    <button
                                        key={q.queueId}
                                        type="button"
                                        onClick={() => toggleQueue(q.queueId)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-sm font-bold",
                                            isSelectedRow 
                                                ? "bg-primary/5 border-primary/20 text-text-main shadow-sm" 
                                                : "bg-transparent border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-5 h-5 rounded-lg border flex items-center justify-center transition-all", 
                                                isSelectedRow ? "bg-primary border-primary rotate-0" : "border-slate-300 -rotate-90 opacity-40"
                                            )}>
                                                {isSelectedRow && <Check className="h-3 w-3 text-white stroke-[4]" />}
                                            </div>
                                            <span>{q.name}</span>
                                        </div>
                                        {isSelectedRow && (
                                            <Badge variant="success" className="text-[8px] h-4 font-black uppercase tracking-tighter">Assignée</Badge>
                                        )}
                                    </button>
                                );
                            })}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {watchedQueueIds.length} file(s) sélectionnée(s)
                        </p>
                        <Button type="button" onClick={() => setIsQueueModalOpen(false)} className="rounded-xl px-8 shadow-md">
                            Valider l'Affectation
                        </Button>
                    </div>
                </div>
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
                onDelete={handleBulkDeleteUsers}
                onActivate={() => handleBulkToggleUsers(true)}
                onDeactivate={() => handleBulkToggleUsers(false)}
                onClear={clearSelection}
                isLoading={bulkDeleteUsers.isPending || bulkUpdateStatus.isPending}
                label="utilisateurs sélectionnés"
            />
        </div>
    );
};
