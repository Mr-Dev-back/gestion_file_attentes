import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from '../components/molecules/ui/toast';
import { useAuthStore } from '../stores/useAuthStore';

export interface User {
    userId: string;
    username: string;
    email: string;
    role: 'ADMINISTRATOR' | 'SUPERVISOR' | 'MANAGER' | 'AGENT_QUAI' | 'AGENT_GUERITE';
    isActive: boolean;
    site?: {
        siteId: string;
        name: string;
        company?: {
            companyId: string;
            name: string;
        };
    };
    company?: {
        companyId: string;
        name: string;
    };
    queue?: {
        queueId: string;
        name: string;
    };
    queues?: {
        queueId: string;
        name: string;
    }[];
    siteId?: string | null;
    companyId?: string | null;
    queueId?: string | null;
    queueIds?: string[];
    failedLoginAttempts?: number;
    lockUntil?: string;
    lastLoginAt?: string;
    firstName?: string | null;
    lastName?: string | null;
}

export const useUsers = (filters?: { page?: number; limit?: number; search?: string }) => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const usersQuery = useQuery({
        queryKey: ['users', filters],
        queryFn: async () => {
            const { data } = await api.get('/users', { params: filters });
            return data;
        },
        enabled: user?.role === 'ADMINISTRATOR',
    });

    const createUserMutation = useMutation({
        mutationFn: async (newUser: Partial<User> & { password?: string }) => {
            const { data } = await api.post<User>('/users', newUser);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast('Utilisateur créé avec succès', 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la création de l'utilisateur", 'error');
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
            const { data: updatedUser } = await api.put<User>(`/users/${id}`, data);
            return updatedUser;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast('Utilisateur mis à jour avec succès', 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la mise à jour", 'error');
        },
    });

    const deleteUser = useMutation({
        mutationFn: async (userId: string) => {
            await api.delete(`/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast("Utilisateur supprimé", "success");
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la suppression", "error");
        }
    });

    const toggleActive = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            await api.put(`/users/${id}`, { isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast("Statut mis à jour", "success");
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la mise à jour", "error");
        }
    });

    const unlockUser = useMutation({
        mutationFn: async (userId: string) => {
            await api.put(`/users/${userId}/unlock`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast("Utilisateur débloqué", "success");
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors du déblocage", "error");
        }
    });

    const getLoginHistory = async (userId: string) => {
        const { data } = await api.get(`/users/${userId}/history`);
        return data;
    };

    const getUserSessions = async (userId: string) => {
        const { data } = await api.get(`/users/${userId}/sessions`);
        return data;
    };

    const revokeSession = useMutation({
        mutationFn: async (sessionId: string) => {
            await api.delete(`/users/sessions/${sessionId}`);
        },
        onSuccess: () => {
            // No need to invalidate users, but might want to invalidate specific user sessions if we had a query for it
            toast("Session révoquée", "success");
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la révocation", "error");
        }
    });

    const bulkDeleteUsers = useMutation({
        mutationFn: async (ids: string[]) => {
            await api.delete('/users/bulk', { data: { ids } });
        },
        onSuccess: (_, ids) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast(`${ids.length} utilisateurs supprimés`, 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la suppression groupée", 'error');
        },
    });

    const bulkUpdateStatus = useMutation({
        mutationFn: async ({ ids, isActive }: { ids: string[]; isActive: boolean }) => {
            await api.patch('/users/bulk-status', { ids, isActive });
        },
        onSuccess: (_, { ids, isActive }) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast(`${ids.length} utilisateurs ${isActive ? 'activés' : 'désactivés'}`, 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la mise à jour groupée", 'error');
        },
    });

    return {
        users: Array.isArray(usersQuery.data) ? usersQuery.data : (usersQuery.data?.data || []),
        total: !Array.isArray(usersQuery.data) ? usersQuery.data?.total || 0 : (usersQuery.data?.length || 0),
        isLoading: usersQuery.isLoading,
        isError: usersQuery.isError,
        createUser: createUserMutation,
        updateUser: updateUserMutation,
        deleteUser,
        toggleActive,
        unlockUser,
        getLoginHistory,
        getUserSessions,
        revokeSession,
        bulkDeleteUsers,
        bulkUpdateStatus
    };
};
