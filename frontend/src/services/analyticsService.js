import { api } from '../services/api';

export const analyticsService = {
  getDashboardStats: async (siteId = 'global', period = 'today') => {
    const { data } = await api.get('/analytics/stats', { params: { siteId, period } });
    return data;
  },
  getTicketLogs: async (siteId = 'global') => {
    const { data } = await api.get('/analytics/site-details', { params: { siteId } });
    return data;
  }
};
