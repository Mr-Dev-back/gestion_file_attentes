import React, { useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/useAuthStore';
import { performTokenRefresh } from '../services/api';
import type { ConnectionState } from '../components/atoms/ui/ConnectionStatus';
import { SocketContext } from '../contexts/socketContext';
import { isTokenExpired } from '../utils/auth';

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [state, setState] = useState<ConnectionState>('disconnected');
    const { token } = useAuthStore();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const siteIdFromUrl = urlParams.get('siteId') ?? undefined;

        if (!token && !siteIdFromUrl) {
            return;
        }

        // Si le token est expiré, on refresh AVANT de tenter la connexion socket
        // pour éviter les erreurs 401/jwt-expired inutiles dans la console.
        if (token && isTokenExpired(token)) {
            performTokenRefresh().catch(err => {
                console.error('Initial socket token refresh failed:', err);
            });
            return; // L'update du token via performTokenRefresh relancera cet effet
        }

        const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

        const authPayload: { token?: string; siteId?: string } = {};
        if (token) authPayload.token = token;
        if (siteIdFromUrl) authPayload.siteId = siteIdFromUrl;

        const queryPayload: { siteId?: string } = {};
        if (siteIdFromUrl) queryPayload.siteId = siteIdFromUrl;

        const newSocket = io(SOCKET_URL, {
            auth: authPayload,
            query: queryPayload,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 5000,
            transports: ['websocket', 'polling'],
            withCredentials: true
        });

        newSocket.on('connect', () => {
            setState('connected');
        });

        newSocket.on('disconnect', (reason) => {
            setState(reason === 'io server disconnect' ? 'disconnected' : 'connecting');
        });

        newSocket.on('connect_error', async (error) => {
            console.error('Socket connection error:', error.message);
            
            // Si le token est expiré, on délègue au mécanisme de refresh unifié d'Axios/API
            if (error.message.includes('jwt expired') || error.message.includes('Authentification échouée')) {

                newSocket.disconnect(); // Déconnecter pour éviter les boucles
                
                try {
                    // Utiliser le mécanisme unifié qui gère la file d'attente globale
                    await performTokenRefresh();

                    // Note: Le re-rendu provoqué par useAuthStore.setToken dans performTokenRefresh
                    // s'occupera de recréer le socket via les dépendances du useEffect.
                } catch (refreshError) {
                    console.error('Socket unified refresh failed, logging out:', refreshError);
                    useAuthStore.getState().logout();
                }
            } else if (error.message.includes('Accès refusé')) {
                newSocket.disconnect();
                useAuthStore.getState().logout();
            }
            
            setState('error');
        });

        queueMicrotask(() => {
            setSocket(newSocket);
        });

        return () => {
            newSocket.disconnect();
            queueMicrotask(() => {
                setSocket((currentSocket) => currentSocket === newSocket ? null : currentSocket);
                setState('disconnected');
            });
        };
    }, [token]);

    return (
        <SocketContext.Provider value={{ socket, state }}>
            {children}
        </SocketContext.Provider>
    );
};
