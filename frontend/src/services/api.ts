import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// L'intercepteur de requête n'est plus nécessaire car le token est géré par Cookie HttpOnly automatiquement par le navigateur.
// On garde juste la config de base.
api.defaults.withCredentials = true; // Important pour envoyer les cookies

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

interface FailedRequest {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}

// Queue pour les requêtes en attente pendant que le refresh se fait
let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

/**
 * Process the queue of pending requests/promises after a token refresh
 */
const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

/**
 * Atomic token refresh function.
 * Ensures only one refresh request is made at a time.
 * Can be called by Axios interceptors or Socket.IO connection handlers.
 */
export const performTokenRefresh = async () => {
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        });
    }

    isRefreshing = true;

    try {
        // Tenter le refresh via le cookie HttpOnly
        const response = await api.post('/auth/refresh-token');
        const newToken = response.data.token;

        if (newToken) {
            useAuthStore.getState().setToken(newToken);
        }

        // Si succès, on dépile la queue
        processQueue(null, newToken);
        return newToken;
    } catch (err) {
        processQueue(err, null);
        
        // Si refresh échoue de manière critique, on déconnecte
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        throw err;
    } finally {
        isRefreshing = false;
    }
};

// Intercepteur pour gérer les erreurs 401
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryableRequestConfig | undefined;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        // Détecter 401 (Unauthorized) - Sauf sur login et refresh-token
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            // Si c'est le login ou le refresh qui échoue -> on ne tente pas de refresh
            if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
                useAuthStore.getState().logout();
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                // Délégation au mécanisme atomique unifié
                await performTokenRefresh();
                
                // Rejouer la requête originale
                // Note: axios renverra automatiquement le nouveau cookie accessToken mis par le serveur
                return api(originalRequest);
            } catch (err) {
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);
