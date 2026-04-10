import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Ticket } from '../types/ticket';


export const useTickets = (queueId?: string, status?: string): {
    tickets: Ticket[];
    isLoading: boolean;
    error: Error | null;
    refetch: any
} => {
    const { data: tickets = [], isLoading, error, refetch } = useQuery<Ticket[]>({
        queryKey: ['tickets', queueId, status],
        queryFn: async () => {
            if (!queueId) return [];
            const response = await api.get(`/tickets/queue/${queueId}`, {
                params: { status }
            });
            return response.data;
        },
        enabled: !!queueId,
        refetchInterval: 5000 // Poll every 5 seconds for now (WebSocket later)
    });

    return { tickets, isLoading, error, refetch };
};

export const useStepConfig = (ticketId?: string, quaiId?: string) => {
    return useQuery({
        queryKey: ['stepConfig', ticketId, quaiId],
        queryFn: async () => {
            if (!ticketId || !quaiId) return { formConfig: {} };
            const response = await api.get(`/tickets/${ticketId}/step-config`, {
                params: { quaiId }
            });
            return response.data;
        },
        enabled: !!ticketId && !!quaiId
    });
};

export const useTicketActions = () => {
    const queryClient = useQueryClient();

    const callTicket = useMutation({
        mutationFn: async (ticketId: string) => {
            const response = await api.post(`/tickets/${ticketId}/call`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        }
    });

    const isolateTicket = useMutation({
        mutationFn: async (ticketId: string) => {
            const response = await api.patch(`/tickets/${ticketId}/isolate`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        }
    });

    const startTicket = useMutation({
        mutationFn: async (ticketId: string) => {
            const response = await api.post(`/tickets/${ticketId}/start`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        }
    });

    const endTicket = useMutation({
        mutationFn: async ({ ticketId, formData }: { ticketId: string, formData?: any }) => {
            const response = await api.post(`/tickets/${ticketId}/complete`, { formData });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        }
    });

    const recallTicket = useMutation({
        mutationFn: async (ticketId: string) => {
            const response = await api.post(`/tickets/${ticketId}/recall`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        }
    });

    const saveWeight = useMutation({
        mutationFn: async ({ ticketId, grossWeight, tareWeight, observation }: { ticketId: string, grossWeight?: number, tareWeight?: number, observation?: string }) => {
            const response = await api.post(`/tickets/${ticketId}/weight`, { grossWeight, tareWeight, observation });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        }
    });

    const startLoading = useMutation({
        mutationFn: async (ticketId: string) => {
            const response = await api.post(`/tickets/${ticketId}/loading/start`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        }
    });

    const endLoading = useMutation({
        mutationFn: async ({ ticketId, loadedQuantity, observation }: { ticketId: string, loadedQuantity?: number, observation?: string }) => {
            const response = await api.post(`/tickets/${ticketId}/loading/end`, { loadedQuantity, observation });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        }
    });

    const reportIncident = useMutation({
        mutationFn: async ({ ticketId, reason, details }: { ticketId: string, reason: string, details?: string }) => {
            const response = await api.post(`/tickets/${ticketId}/incident`, { reason, details });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        }
    });

    return {
        callTicket,
        isolateTicket,
        startTicket,
        endTicket,
        recallTicket,
        saveWeight,
        startLoading,
        endLoading,
        reportIncident
    };
};
