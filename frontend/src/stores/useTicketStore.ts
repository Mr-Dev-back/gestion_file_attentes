import { create } from 'zustand';
import { ticketApi, type TicketCreatePayload, type TicketFilters } from '../services/ticketApi';
import type { Ticket, TicketFormData } from '../types/ticket';

interface TicketStore {
    tickets: Ticket[];
    isLoading: boolean;
    fetchTickets: (filters?: TicketFilters) => Promise<void>;
    addTicket: (ticketData: TicketCreatePayload) => Promise<Ticket>;
    completeStep: (ticketId: string, formData: TicketFormData) => Promise<void>;
    callTicket: (ticketId: string, quaiId?: string) => Promise<void>;
    recallTicket: (ticketId: string) => Promise<void>;
    startTicket: (ticketId: string, quaiId?: string) => Promise<void>;
    
    // Socket.io updates
    handleSocketUpdate: (updatedTicket: Ticket) => void;
    handleSocketDelete: (ticketId: string) => void;
}

export const useTicketStore = create<TicketStore>((set) => ({
    tickets: [],
    isLoading: false,

    fetchTickets: async (filters) => {
        set({ isLoading: true });
        try {
            const tickets = await ticketApi.getTickets(filters);
            set({ tickets, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
            set({ isLoading: false });
        }
    },

    addTicket: async (ticketData) => {
        try {
            const newTicket = await ticketApi.createTicket(ticketData);
            set((state) => ({
                tickets: [newTicket, ...state.tickets]
            }));
            return newTicket;
        } catch (error) {
            console.error('Failed to add ticket:', error);
            throw error;
        }
    },

    completeStep: async (ticketId, formData) => {
        try {
            await ticketApi.completeStep(ticketId, formData);
        } catch (error) {
            console.error('Failed to complete step:', error);
            throw error;
        }
    },

    callTicket: async (ticketId, quaiId) => {
        try {
            await ticketApi.callTicket(ticketId, quaiId ? { quaiId } : undefined);
        } catch (error) {
            console.error('Failed to call ticket:', error);
            throw error;
        }
    },

    recallTicket: async (ticketId) => {
        try {
            await ticketApi.recallTicket(ticketId);
        } catch (error) {
            console.error('Failed to recall ticket:', error);
            throw error;
        }
    },

    startTicket: async (ticketId, quaiId) => {
        try {
            await ticketApi.processTicket(ticketId, quaiId ? { quaiId } : undefined);
        } catch (error) {
            console.error('Failed to start ticket:', error);
            throw error;
        }
    },

    handleSocketUpdate: (updatedTicket) => {
        set((state) => {
            const index = state.tickets.findIndex((t) => t.ticketId === updatedTicket.ticketId);
            if (index !== -1) {
                const newTickets = [...state.tickets];
                newTickets[index] = { ...newTickets[index], ...updatedTicket };
                return { tickets: newTickets };
            } else {
                // If ticket is not in list but matches current filters (simplification)
                return { tickets: [updatedTicket, ...state.tickets] };
            }
        });
    },

    handleSocketDelete: (ticketId) => {
        set((state) => ({
            tickets: state.tickets.filter((t) => t.ticketId !== ticketId)
        }));
    }
}));
