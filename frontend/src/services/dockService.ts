import { api } from './api';

export const dockService = {
    /**
     * Get all queues
     */
    getQueues: () => api.get('/queues'),

    /**
     * Get tickets for a specific queue
     */
    getQueueTickets: (queueId: string, status?: string) => {
        const params = status ? { status } : {};
        return api.get(`/tickets/queue/${queueId}/tickets`, { params });
    },

    /**
     * Call a ticket
     */
    callTicket: (ticketId: string, zone: string) =>
        api.post(`/tickets/${ticketId}/call`, { zone }),

    /**
     * Recall a ticket
     */
    recallTicket: (ticketId: string) =>
        api.post(`/tickets/${ticketId}/recall`),

    /**
     * Complete service for a ticket
     */
    completeTicket: (ticketId: string) =>
        api.post(`/tickets/${ticketId}/complete-service`),

    /**
     * Start processing a ticket
     */
    startProcessing: (ticketId: string) =>
        api.post(`/tickets/${ticketId}/start`)
};
