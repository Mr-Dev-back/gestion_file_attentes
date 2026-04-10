import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ticketApi } from '../services/ticketApi';
import type { QueueStatusEntry } from '../types/ticket';
import { useSocket } from './useSocket';

export function useQueueStatus(siteId?: string) {
    const queryClient = useQueryClient();
    const { socket } = useSocket(siteId);

    const { data: queueStatus = [], isLoading, refetch } = useQuery<QueueStatusEntry[]>({
        queryKey: ['queue-status', siteId],
        queryFn: () => ticketApi.getQueueStatus(siteId),
        refetchInterval: 60000, // Backup polling every 60s
    });

    useEffect(() => {
        if (!socket) return;

        const handleQueueUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['queue-status', siteId] });
        };

        socket.on('queue-updated', handleQueueUpdate);
        socket.on('ticket-status-updated', handleQueueUpdate);

        return () => {
            socket.off('queue-updated', handleQueueUpdate);
            socket.off('ticket-status-updated', handleQueueUpdate);
        };
    }, [socket, queryClient, siteId]);

    return {
        queueStatus,
        isLoading,
        refetch
    };
}
