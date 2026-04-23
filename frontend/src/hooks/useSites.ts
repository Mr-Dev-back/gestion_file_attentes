import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from '../components/molecules/ui/toast';

export interface Site {
    siteId: string;
    name: string;
    code?: string;
    companyId: string;
    workflowId?: string;
    isActive?: boolean;
    isMonoUserProcess: boolean;
    config: {
        stages: string[];
        allowDirectPass: boolean;
    };
    establishmentName?: string;
    alertThreshold?: number;
    company?: {
        name: string;
    };
    workflow?: {
        name: string;
    };
}

export const useSites = (filters?: { page?: number; limit?: number; search?: string }) => {
    const queryClient = useQueryClient();

    const sitesQuery = useQuery({
        queryKey: ['sites', filters],
        queryFn: async () => {
            const { data } = await api.get('/sites', { params: filters });
            return data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newSite: Partial<Site>) => {
            const { data } = await api.post<Site>('/sites', newSite);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            toast('Site créé avec succès', 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la création", 'error');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Site> }) => {
            const { data: updated } = await api.put<Site>(`/sites/${id}`, data);
            return updated;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            toast('Site mis à jour', 'success');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/sites/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            toast('Site supprimé', 'success');
        },
    });

    const bulkDeleteSites = useMutation({
        mutationFn: async (ids: string[]) => {
            await api.delete('/sites/bulk', { data: { ids } });
        },
        onSuccess: (_, ids) => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            toast(`${ids.length} sites supprimés`, 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la suppression groupée", 'error');
        }
    });

    return {
        data: sitesQuery.data,
        sites: Array.isArray(sitesQuery.data) ? sitesQuery.data : (sitesQuery.data?.data || []),
        total: !Array.isArray(sitesQuery.data) ? sitesQuery.data?.total || 0 : (sitesQuery.data?.length || 0),
        isLoading: sitesQuery.isLoading,
        createSite: createMutation,
        updateSite: updateMutation,
        deleteSite: deleteMutation,
        bulkDeleteSites
    };
};
