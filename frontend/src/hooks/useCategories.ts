import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { api } from '../services/api';
import { useToastStore } from '../components/molecules/ui/toast';

export interface Category {
    categoryId: string;
    name: string;
    description?: string;
    color?: string;
    prefix: string;
    estimatedDuration?: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const useCategories = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToastStore();
    const getErrorMessage = (error: unknown, fallback: string) => {
        const apiError = error as AxiosError<{ error?: string }>;
        return apiError.response?.data?.error || fallback;
    };

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get<Category[]>('/categories');
            return data;
        }
    });

    const createCategory = useMutation({
        mutationFn: (data: Partial<Category>) => api.post('/categories', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            addToast('Catégorie créée', 'success');
        },
        onError: (error) => addToast(getErrorMessage(error, 'Erreur création'), 'error')
    });

    const updateCategory = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => api.put(`/categories/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            addToast('Catégorie mise à jour', 'success');
        },
        onError: (error) => addToast(getErrorMessage(error, 'Erreur mise à jour'), 'error')
    });

    const deleteCategory = useMutation({
        mutationFn: (categoryId: string) => api.delete(`/categories/${categoryId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            addToast('Catégorie supprimée', 'success');
        },
        onError: (error) => addToast(getErrorMessage(error, 'Erreur suppression'), 'error')
    });

    const bulkDeleteCategories = useMutation({
        mutationFn: (ids: string[]) => api.delete('/categories/bulk', { data: { ids } }),
        onSuccess: (_, ids) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            addToast(`${ids.length} catégories supprimées`, 'success');
        },
        onError: (error) => addToast(getErrorMessage(error, 'Erreur suppression groupée'), 'error')
    });

    const bulkUpdateCategoryStatus = useMutation({
        mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) => 
            api.patch('/categories/bulk-status', { ids, isActive }),
        onSuccess: (_, { ids, isActive }) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            addToast(`${ids.length} catégories ${isActive ? 'activées' : 'désactivées'}`, 'success');
        },
        onError: (error) => addToast(getErrorMessage(error, 'Erreur mise à jour groupée'), 'error')
    });

    return {
        categories,
        isLoading,
        createCategory,
        updateCategory,
        deleteCategory,
        bulkDeleteCategories,
        bulkUpdateCategoryStatus
    };
};
