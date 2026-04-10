import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from '../components/molecules/ui/toast';

export interface QuaiParameter {
  quaiId?: string;
  label: string;
  siteId?: string | null;
  categoryId?: string | null;
  stepId: string;
  queueIds?: string[];
  queues?: Array<{ queueId: string; name: string }>;
  formConfig: any[];
  allowedUsers: string[];
}

export const useQuaiParameters = () => {
  const queryClient = useQueryClient();

  const { data: parameters = [], isLoading, error } = useQuery<QuaiParameter[]>({
    queryKey: ['quaiParameters'],
    queryFn: async () => {
      const { data } = await api.get('/quais/parameters');
      return data;
    }
  });

  const saveParameter = useMutation({
    mutationFn: async (data: QuaiParameter) => {
      const { data: result } = await api.post('/quais/parameters', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quaiParameters'] });
      toast.success('Configuration de quai enregistrée');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
  });

  const deleteParameter = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quais/parameters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quaiParameters'] });
      toast.success('Configuration de quai supprimée');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  });

  return {
    parameters,
    isLoading,
    error,
    saveParameter,
    deleteParameter,
    bulkDeleteParameters: useMutation({
      mutationFn: (ids: string[]) => api.delete('/quais/parameters/bulk', { data: { ids } }),
      onSuccess: (_, ids) => {
        queryClient.invalidateQueries({ queryKey: ['quaiParameters'] });
        toast.success(`${ids.length} configurations de quais supprimées`);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || 'Erreur lors de la suppression groupée');
      }
    })
  };
}
