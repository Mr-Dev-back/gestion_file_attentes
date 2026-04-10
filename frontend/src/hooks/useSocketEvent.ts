import { useEffect, type DependencyList } from 'react';
export { useSocketContext as useSocket } from './useSocketContext';
import { useSocketContext } from './useSocketContext';

/**
 * Custom hook to listen to socket events with automatic cleanup
 * @param event Event name to listen to
 * @param callback Callback function when event is received
 * @param deps Dependency array for the effect
 */
export const useSocketEvent = <T = unknown>(
    event: string,
    callback: (data: T) => void,
    deps: DependencyList = []
) => {
    const { socket } = useSocketContext();

    useEffect(() => {
        if (!socket) return;

        socket.on(event, callback);

        return () => {
            socket.off(event, callback);
        };
    }, [socket, event, ...deps]);
};
