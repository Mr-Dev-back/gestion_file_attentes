import { api } from './api';

export const analyticsApi = {
    getDashboardStats: async (siteId = 'global'): Promise<any> => {
        const { data } = await api.get('/analytics/stats', { params: { siteId } });
        return data;
    },
    getTicketLogs: async (siteId = 'global') => {
        const { data } = await api.get('/analytics/site-details', { params: { siteId } });
        return data;
    }
};
