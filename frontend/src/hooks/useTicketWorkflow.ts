import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { ticketApi } from '../services/ticketApi';
import { toast } from '../components/molecules/ui/toast';
import { useAuthStore } from '../stores/useAuthStore';
import { useSocketContext } from './useSocketContext';
import type {
    SocketTicketEventPayload,
    Ticket,
    TicketCompletionResponse,
    TicketFormData,
    TicketProcessResponse
} from '../types/ticket';

export function useTicketWorkflow(quaiId?: string) {
    const queryClient = useQueryClient();
    const { user, activeCategoryId } = useAuthStore();
    const { socket } = useSocketContext();
    const getErrorMessage = (error: unknown, fallback: string) => {
        const apiError = error as AxiosError<{ error?: string }>;
        return apiError.response?.data?.error || fallback;
    };

    const { data: quaiConfig } = useQuery({
        queryKey: ['quaiConfig', quaiId],
        queryFn: () => ticketApi.getQuaiConfigById(quaiId!),
        enabled: !!quaiId
    });

    const expectedStepCode = quaiConfig?.expectedStepCode;

    const { data: tickets, isLoading, error } = useQuery({
        queryKey: ['tickets', user?.siteId, quaiId, user?.assignedQueueId, user?.role, activeCategoryId],
        queryFn: () => ticketApi.getTickets({
            siteId: user?.siteId,
            quaiId,
            queueId: user?.assignedQueueId || undefined,
            categoryId: activeCategoryId || undefined,
            status: ['EN_ATTENTE', 'CALLING', 'PROCESSING', 'ISOLE']
        }),
        enabled: !!user?.siteId || !!quaiId,
        staleTime: 1000 * 60,
    });

    useEffect(() => {
        if (!socket) return;

        const handleTicketUpdate = (payload: SocketTicketEventPayload) => {
            const ticket = payload.ticket;
            if (!ticket) return;

            queryClient.setQueryData<Ticket[] | undefined>(['tickets', user?.siteId, quaiId, activeCategoryId], (oldData) => {
                if (!Array.isArray(oldData)) return oldData;

                if (['ticket_completed', 'ticket_cancelled'].includes(payload.event || '') || ticket.status === 'COMPLETE' || ticket.status === 'ANNULE') {
                    return oldData.filter((currentTicket) => currentTicket.ticketId !== ticket.ticketId);
                }

                if (expectedStepCode && ticket.currentStep?.stepCode && ticket.currentStep.stepCode !== expectedStepCode) {
                    return oldData.filter((currentTicket) => currentTicket.ticketId !== ticket.ticketId);
                }

                const index = oldData.findIndex((currentTicket) => currentTicket.ticketId === ticket.ticketId);
                const nextData = [...oldData];

                if (index !== -1) {
                    nextData[index] = ticket;
                } else {
                    nextData.push(ticket);
                }

                return nextData.sort((a, b) => {
                    if (b.priority !== a.priority) return (b.priority || 0) - (a.priority || 0);
                    return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime();
                });
            });

            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        };

        const handleNewTicket = (payload: SocketTicketEventPayload) => {
            if (payload.ticket) {
                handleTicketUpdate({ event: 'NEW_TICKET_IN_QUEUE', ticket: payload.ticket });
            }
        };

        socket.on('ticket_updated', handleTicketUpdate);
        socket.on('ticket_created', handleTicketUpdate);
        socket.on('NEW_TICKET_IN_QUEUE', handleNewTicket);
        socket.on('ticket_called', handleTicketUpdate);
        socket.on('ticket_recalled', handleTicketUpdate);
        socket.on('ticket_started', handleTicketUpdate);
        socket.on('ticket_assigned', handleTicketUpdate);
        socket.on('ticket_assigned_quai', handleTicketUpdate);
        socket.on('ticket_isolated', handleTicketUpdate);
        socket.on('ticket_unisolated', handleTicketUpdate);

        return () => {
            socket.off('ticket_updated', handleTicketUpdate);
            socket.off('ticket_created', handleTicketUpdate);
            socket.off('NEW_TICKET_IN_QUEUE', handleNewTicket);
            socket.off('ticket_called', handleTicketUpdate);
            socket.off('ticket_recalled', handleTicketUpdate);
            socket.off('ticket_started', handleTicketUpdate);
            socket.off('ticket_assigned', handleTicketUpdate);
            socket.off('ticket_assigned_quai', handleTicketUpdate);
            socket.off('ticket_isolated', handleTicketUpdate);
            socket.off('ticket_unisolated', handleTicketUpdate);
        };
    }, [socket, queryClient, user?.siteId, quaiId, activeCategoryId, expectedStepCode]);

    const callMutation = useMutation({
        mutationFn: (payload: { ticketId: string; quaiId?: string }) => ticketApi.callTicket(payload.ticketId, { quaiId: payload.quaiId }),
        onSuccess: (data) => {
            toast.success(`Ticket ${data.ticketNumber} appelé`);
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
        onError: (error) => toast.error(getErrorMessage(error, "Erreur lors de l'appel"))
    });

    const recallMutation = useMutation({
        mutationFn: ticketApi.recallTicket,
        onSuccess: (data) => {
            toast.info(`Ticket ${data.ticketNumber} rappelé`);
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
        onError: (error) => toast.error(getErrorMessage(error, 'Erreur lors du rappel'))
    });

    const processMutation = useMutation<TicketProcessResponse, unknown, { ticketId: string; quaiId?: string }>({
        mutationFn: (payload) => ticketApi.processTicket(payload.ticketId, { quaiId: payload.quaiId }),
        onSuccess: (data) => {
            toast.success(`Traitement de ${data.ticket.licensePlate} commencé`);
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
        onError: (error) => toast.error(getErrorMessage(error, 'Erreur démarrage'))
    });

    const assignMutation = useMutation({
        mutationFn: ({ ticketId, quaiId }: { ticketId: string; quaiId: string }) => ticketApi.assignTicket(ticketId, quaiId),
        onSuccess: (data) => {
            toast.success(`Ticket ${data.ticketNumber} assigné au quai`);
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
        onError: (error) => toast.error(getErrorMessage(error, "Erreur d'assignation"))
    });

    const completeMutation = useMutation<TicketCompletionResponse, unknown, { ticketId: string; formData?: TicketFormData; quaiId?: string }>({
        mutationFn: ({ ticketId, formData, quaiId }) => ticketApi.completeStep(ticketId, formData, quaiId),
        onSuccess: (data) => {
            if (data.result.completed) {
                toast.success(`Ticket ${data.ticket.ticketNumber} terminé !`);
            } else {
                toast.success('Étape validée, passage au suivant.');
            }
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
        onError: (error) => toast.error(getErrorMessage(error, 'Erreur validation étape'))
    });

    const isolateMutation = useMutation({
        mutationFn: ticketApi.isolateTicket,
        onSuccess: ({ ticket }) => {
            toast.info(ticket.status === 'ISOLE' ? `Ticket ${ticket.ticketNumber} mis en isolation` : `Ticket ${ticket.ticketNumber} sorti d'isolation`);
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
        onError: (error) => toast.error(getErrorMessage(error, 'Erreur isolation'))
    });

    return {
        tickets,
        isLoading,
        error,
        callTicket: callMutation.mutate,
        recallTicket: recallMutation.mutate,
        processTicket: processMutation.mutate,
        assignTicket: assignMutation.mutate,
        completeStep: completeMutation.mutate,
        isolateTicket: isolateMutation.mutate,
        isCalling: callMutation.isPending,
        isRecalling: recallMutation.isPending,
        isProcessing: processMutation.isPending,
        isAssigning: assignMutation.isPending,
        isCompleting: completeMutation.isPending,
        isIsolating: isolateMutation.isPending
    };
}
