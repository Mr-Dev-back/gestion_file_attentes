import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface Queue {
    queueId: string;
    name: string;
    description?: string;
    siteId?: string;
    type?: string;
    isActive: boolean;
    categoryId?: string;
    stepId?: string;
    quaiId?: string;
    category?: {
        categoryId: string;
        name: string;
        prefix: string;
        color: string;
    };
    step?: {
        stepId: string;
        name: string;
        code: string;
    };
    quai?: {
        quaiId: string;
        label: string;
    };
    site?: {
        siteId: string;
        name: string;
        code: string;
    };
}

export function useQueues() {
    const queryClient = useQueryClient();

    const { data: queues = [], isLoading } = useQuery<Queue[]>({
        queryKey: ['queues'],
        queryFn: async () => {
            const { data } = await api.get('/queues');
            return data;
        },
    });

    const createQueue = useMutation({
        mutationFn: (data: Partial<Queue>) => api.post('/queues', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queues'] }),
    });

    const updateQueue = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Queue> }) => api.put(`/queues/${id}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queues'] }),
    });

    const deleteQueue = useMutation({
        mutationFn: (id: string) => api.delete(`/queues/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queues'] }),
    });

    return {
        queues,
        isLoading,
        createQueue,
        updateQueue,
        deleteQueue,
        bulkUpdateQueueStatus: useMutation({
            mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) => 
                api.patch('/queues/bulk-status', { ids, isActive }),
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queues'] }),
        }),
    };
}
