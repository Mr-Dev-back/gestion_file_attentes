import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useToastStore } from '../components/molecules/ui/toast';

export interface Kiosk {
    kioskId: string;
    name: string;
    type: 'ENTRANCE' | 'EXIT' | 'SERVICE' | 'INFO' | 'WEIGHING_BRIDGE';
    status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'PAPER_EMPTY' | 'ERROR';
    ipAddress?: string;
    siteId: string;
    // Kiosk now has many queues, but frontend might use convenience access or array
    queues?: { queueId: string; name: string }[];
    queueId?: string; // Legacy/Compat for now if needed, but better remove
    capabilities: any;
    config: {
        welcomeMessage: string;
        primaryColor: string;
        logoUrl?: string | null;
        showWeather: boolean;
        language: string;
    };
    site?: { name: string };
    queue?: { name: string };
}

export const useKiosks = (siteId?: string) => {
    const queryClient = useQueryClient();
    const { addToast } = useToastStore();

    // Fetch Kiosks
    const { data: kiosks = [], isLoading } = useQuery<Kiosk[]>({
        queryKey: ['kiosks', siteId],
        queryFn: async () => {
            const params = siteId ? { siteId } : {};
            const { data } = await api.get('/kiosks', { params });
            return data;
        }
    });

    // Create Kiosk
    const createKiosk = useMutation({
        mutationFn: (data: Partial<Kiosk>) => api.post('/kiosks', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kiosks'] });
            addToast('Borne créée avec succès', 'success');
        },
        onError: (error: any) => {
            addToast(error.response?.data?.error || 'Erreur lors de la création', 'error');
        }
    });

    // Update Kiosk
    const updateKiosk = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<Kiosk> }) => api.put(`/kiosks/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kiosks'] });
            addToast('Borne mise à jour', 'success');
        },
        onError: (error: any) => {
            addToast(error.response?.data?.error || 'Erreur lors de la mise à jour', 'error');
        }
    });

    // Delete Kiosk
    const deleteKiosk = useMutation({
        mutationFn: (id: string) => api.delete(`/kiosks/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kiosks'] });
            addToast('Borne supprimée', 'success');
        },
        onError: (error: any) => {
            addToast(error.response?.data?.error || 'Erreur lors de la suppression', 'error');
        }
    });

    // Bulk Delete Kiosks
    const bulkDeleteKiosks = useMutation({
        mutationFn: (ids: string[]) => api.delete('/kiosks/bulk', { data: { ids } }),
        onSuccess: (_, ids) => {
            queryClient.invalidateQueries({ queryKey: ['kiosks'] });
            addToast(`${ids.length} bornes supprimées`, 'success');
        },
        onError: (error: any) => {
            addToast(error.response?.data?.error || 'Erreur lors de la suppression groupée', 'error');
        }
    });

    // Bulk Update Kiosk Status
    const bulkUpdateKiosksStatus = useMutation({
        mutationFn: ({ ids, status }: { ids: string[]; status: string }) => 
            api.patch('/kiosks/bulk-status', { ids, status }),
        onSuccess: (_, { ids, status }) => {
            queryClient.invalidateQueries({ queryKey: ['kiosks'] });
            addToast(`${ids.length} bornes passées en ${status}`, 'success');
        },
        onError: (error: any) => {
            addToast(error.response?.data?.error || 'Erreur lors de la mise à jour groupée', 'error');
        }
    });

    return {
        kiosks,
        isLoading,
        createKiosk,
        updateKiosk,
        deleteKiosk,
        bulkDeleteKiosks,
        bulkUpdateKiosksStatus
    };
};
