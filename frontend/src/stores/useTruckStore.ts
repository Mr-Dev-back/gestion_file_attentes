import { create } from 'zustand';
import type { AxiosError } from 'axios';
import { api } from '../services/api';

export type TruckStatus =
    | 'EN_ATTENTE'
    | 'APPELE'
    | 'EN_TRAITEMENT'
    | 'EN_PAUSE'
    | 'TRANSFERE'
    | 'COMPLETE'
    | 'ABANDONNE'
    | 'ANNULE'
    | 'INCIDENT'
    | 'PESEE_ENTREE'
    | 'PESEE_SORTIE';

export type TruckPriority = 'NORMAL' | 'URGENT' | 'CRITIQUE';

export interface Truck {
    ticketId: string;
    ticketNumber: string;
    licensePlate: string;
    driverName: string;
    companyName: string;
    driverPhone?: string;
    salesPerson?: string;
    department?: string; // Deprecated but kept for compatibility
    categories: string[];
    currentCategoryIndex: number;
    orderNumber?: string;
    priority: TruckPriority;
    status: TruckStatus;
    category?: { name: string; prefix: string };
    loadedProducts?: Array<Record<string, unknown>>;
    createdAt: string;
    arrivedAt: string;
    calledAt?: string;
    weighedInAt?: string;
    loadingStartedAt?: string;
    loadingFinishedAt?: string;
    weighedOutAt?: string;
    completedAt?: string;
    weightIn?: number;
    weightOut?: number;
    netWeight?: number;
    zone?: string;
    callZone?: string;
    notes?: string;
    qrCode?: string;
}

interface TruckStore {
    trucks: Truck[];
    isLoading: boolean;
    fetchTrucks: (filters?: { status?: string }) => Promise<void>;
    addTruck: (truckData: Partial<Truck>) => Promise<Truck>;
    updateStatus: (ticketId: string, status: TruckStatus, extraData?: Record<string, unknown>) => Promise<void>;
    transferTicket: (ticketId: string, newCategory: string) => Promise<{ oldTicketNumber: string; newTicketNumber: string }>;
    weighIn: (ticketId: string, weight: number) => Promise<void>;
    weighOut: (ticketId: string, weight: number) => Promise<void>;
    getQueuedTrucks: () => Truck[];
    getCalledTrucks: () => Truck[];
}

export const useTruckStore = create<TruckStore>((set, get) => ({
    trucks: [],
    isLoading: false,

    fetchTrucks: async (filters) => {
        set({ isLoading: true });
        try {
            const response = await api.get('/tickets', { params: filters });
            set({ trucks: response.data, isLoading: false });
        } catch (error) {
            const apiError = error as AxiosError;
            if (apiError.response?.status === 404) {
                // Feature disabled/removed
                console.warn('Ticket system endpoint not found (404). Treating as empty.');
                set({ trucks: [], isLoading: false });
            } else {
                console.error('Failed to fetch trucks:', error);
                set({ isLoading: false });
            }
        }
    },

    addTruck: async (truckData) => {
        try {
            const response = await api.post('/tickets', truckData);
            // new schema returns the ticket object directly or wrapped?
            // ticketController createTicket returns fullTicket (the object)
            const newTruck = response.data;
            set((state) => ({
                trucks: [newTruck, ...state.trucks]
            }));
            return newTruck;
        } catch (error) {
            console.error('Failed to add truck:', error);
            throw error;
        }
    },

    updateStatus: async (ticketId, status, extraData = {}) => {
        try {
            // Map legacy status updates to specific action endpoints
            let endpoint = `/tickets/${ticketId}/status`; // fallback
            let method: 'patch' | 'post' = 'patch';

            if (status === 'APPELE') endpoint = `/tickets/${ticketId}/call`;
            else if (status === 'EN_TRAITEMENT') endpoint = `/tickets/${ticketId}/process`;
            else if (status === 'ANNULE') {
                endpoint = `/tickets/${ticketId}/cancel`;
                method = 'post';
            }
            else if (status === 'COMPLETE') {
                endpoint = `/tickets/${ticketId}/complete`;
                method = 'post';
            }

            const response = await api[method](endpoint, extraData);

            // Refresh the specific truck in the list
            const updatedData = response.data.ticket || response.data; 

            set((state) => ({
                trucks: state.trucks.map(t => t.ticketId === ticketId ? { ...t, ...updatedData } : t)
            }));
        } catch (error) {
            console.error('Failed to update status:', error);
            throw error;
        }
    },

    transferTicket: async (ticketId, newCategory) => {
        try {
            const response = await api.patch(`/tickets/${ticketId}/transfer`, { categoryId: newCategory });
            // Refresh the truck list to reflect changes
            await get().fetchTrucks();
            // Return the transfer information
            return {
                oldTicketNumber: response.data.oldTicketNumber,
                newTicketNumber: response.data.newTicketNumber
            };
        } catch (error) {
            console.error('Failed to transfer ticket:', error);
            throw error;
        }
    },

    weighIn: async (ticketId, weight) => {
        try {
            await api.post(`/tickets/${ticketId}/complete`, { formData: { weightIn: weight } });
            // Refresh the truck list to reflect changes
            await get().fetchTrucks();
        } catch (error) {
            console.error('Failed to weigh in:', error);
            throw error;
        }
    },

    weighOut: async (ticketId, weight) => {
        try {
            await api.post(`/tickets/${ticketId}/complete`, { formData: { weightOut: weight } });
            // Refresh the truck list to reflect changes
            await get().fetchTrucks();
        } catch (error) {
            console.error('Failed to weigh out:', error);
            throw error;
        }
    },

    getQueuedTrucks: () => get().trucks.filter(t => t.status === 'EN_ATTENTE'),
    getCalledTrucks: () => get().trucks.filter(t => t.status === 'APPELE' || t.status === 'EN_TRAITEMENT'),
}));
