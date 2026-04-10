import { api } from './api';
import type {
    QuaiConfigResponse,
    QueueStatusEntry,
    Ticket,
    TicketCompletionResponse,
    TicketFormData,
    TicketFullHistory,
    TicketProcessResponse
} from '../types/ticket';

export interface TicketFilters {
    status?: string | string[];
    siteId?: string;
    queueId?: string;
    quaiId?: string;
    categoryId?: string;
}

export interface TicketCreatePayload {
    siteId?: string;
    categoryId?: string;
    priority?: number;
    driverName?: string;
    driverPhone?: string;
    licensePlate?: string;
    orderNumber?: string;
    companyName?: string;
}

export interface TicketActionPayload {
    quaiId?: string;
}

export const ticketApi = {
    async getTickets(params?: TicketFilters) {
        const { data } = await api.get<Ticket[]>('/tickets', { params });
        return data;
    },

    async getQuaiConfigById(quaiId: string) {
        const { data } = await api.get<QuaiConfigResponse>(`/quais/config/${quaiId}`);
        return data;
    },

    async createTicket(payload: TicketCreatePayload) {
        const { data } = await api.post<Ticket>('/tickets', payload);
        return data;
    },

    async callTicket(ticketId: string, payload?: TicketActionPayload) {
        const { data } = await api.patch<Ticket>(`/tickets/${ticketId}/call`, payload);
        return data;
    },

    async recallTicket(ticketId: string) {
        const { data } = await api.patch<Ticket>(`/tickets/${ticketId}/recall`);
        return data;
    },

    async processTicket(ticketId: string, payload?: TicketActionPayload) {
        const { data } = await api.patch<TicketProcessResponse>(`/tickets/${ticketId}/process`, payload);
        return data;
    },

    async assignTicket(ticketId: string, quaiId: string) {
        const { data } = await api.patch<Ticket>(`/tickets/${ticketId}/assign`, { quaiId });
        return data;
    },

    async completeStep(ticketId: string, formData: TicketFormData = {}, quaiId?: string) {
        const { data } = await api.post<TicketCompletionResponse>(`/tickets/${ticketId}/complete`, { formData, quaiId });
        return data;
    },

    async isolateTicket(ticketId: string) {
        const { data } = await api.patch<{ ticket: Ticket; isIsolated: boolean }>(`/tickets/${ticketId}/isolate`);
        return data;
    },

    async cancelTicket(ticketId: string, reason: string) {
        const { data } = await api.post(`/tickets/${ticketId}/cancel`, { reason });
        return data;
    },

    async updatePriority(ticketId: string, priority: number, reason?: string) {
        const { data } = await api.patch(`/tickets/${ticketId}/priority`, { priority, reason });
        return data;
    },

    async getPublicDisplayData(siteId: string) {
        const { data } = await api.get(`/public/display/${siteId}`);
        return data;
    },

    async getPublicSites() {
        const { data } = await api.get<{ siteId: string; name: string }[]>('/public/display/sites');
        return data;
    },

    async getQuaiHistory(quaiId: string) {
        const { data } = await api.get<Ticket[]>(`/tickets/quai-history/${quaiId}`);
        return data;
    },

    async getTicketFullHistory(ticketId: string) {
        const { data } = await api.get<TicketFullHistory>(`/tickets/${ticketId}/full-history`);
        return data;
    },

    async transferTicket(ticketId: string, targetQuaiId?: string, targetCategoryId?: string) {
        const { data } = await api.patch<{ success: boolean; ticket: Ticket }>(`/tickets/${ticketId}/transfer`, { targetQuaiId, targetCategoryId });
        return data;
    },

    async getAvailableQuaisForStep(stepId: string) {
        const { data } = await api.get<{ quaiId: string; label: string }[]>(`/quais/available-for-step/${stepId}`);
        return data;
    },

    async getQueueStatus(siteId?: string) {
        const { data } = await api.get<QueueStatusEntry[]>('/queues/status', {
            params: siteId ? { siteId } : undefined
        });
        return data;
    }
};
