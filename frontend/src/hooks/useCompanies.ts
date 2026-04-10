import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from '../components/molecules/ui/toast';

export interface Company {
    companyId: string;
    name: string;
    code: string;
    logo?: string;
    description?: string;
    isActive: boolean;
}

export const useCompanies = () => {
    const queryClient = useQueryClient();

    const companiesQuery = useQuery({
        queryKey: ['companies'],
        queryFn: async () => {
            const { data } = await api.get<Company[]>('/companies');
            return data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newCompany: Partial<Company>) => {
            const { data } = await api.post<Company>('/companies', newCompany);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast('Société créée avec succès', 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la création", 'error');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Company> }) => {
            const { data: updated } = await api.put<Company>(`/companies/${id}`, data);
            return updated;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast('Société mise à jour', 'success');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/companies/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast('Société supprimée', 'success');
        },
    });

    const bulkDeleteCompanies = useMutation({
        mutationFn: async (ids: string[]) => {
            await api.delete('/companies/bulk', { data: { ids } });
        },
        onSuccess: (_, ids) => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast(`${ids.length} sociétés supprimées`, 'success');
        },
        onError: (error: any) => {
            toast(error.response?.data?.error || "Erreur lors de la suppression groupée", 'error');
        }
    });

    return {
        companies: companiesQuery.data || [],
        isLoading: companiesQuery.isLoading,
        createCompany: createMutation,
        updateCompany: updateMutation,
        deleteCompany: deleteMutation,
        bulkDeleteCompanies
    };
};
