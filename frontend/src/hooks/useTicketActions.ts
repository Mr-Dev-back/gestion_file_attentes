import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../services/ticketApi';
import { toast } from '../components/molecules/ui/toast';

export function useTicketActions() {
    const queryClient = useQueryClient();

    const updatePriority = useMutation({
        mutationFn: ({ ticketId, priority, reason }: { ticketId: string; priority: number; reason?: string }) =>
            ticketApi.updatePriority(ticketId, priority, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.error || 'Erreur lors de la mise à jour de la priorité';
            toast.error(message);
        }
    });

    return {
        updatePriority
    };
}
