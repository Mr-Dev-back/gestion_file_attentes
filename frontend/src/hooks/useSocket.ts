import { useEffect } from 'react';
import { useSocketContext } from './useSocketContext';

export const useSocket = (siteId?: string, queueId?: string) => {
    const { socket, state } = useSocketContext();
    const isConnected = state === 'connected';

    useEffect(() => {
        if (!socket || !isConnected) return;

        if (siteId) socket.emit('join-site', siteId);
        if (queueId) socket.emit('join-queue', queueId);

    }, [socket, isConnected, siteId, queueId]);

    return {
        socket,
        isConnected
    };
};
