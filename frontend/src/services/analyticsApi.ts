import { api } from './api';

export const analyticsApi = {
    getDashboardStats: async (siteId = 'global', startDate?: string, endDate?: string): Promise<any> => {
        const { data } = await api.get('/analytics/stats', { params: { siteId, startDate, endDate } });
        return data;
    },
    getReports: async (startDate?: string, endDate?: string, siteId = 'global') => {
        const { data } = await api.get('/analytics/reports', { params: { startDate, endDate, siteId } });
        return data;
    },
    getTicketsList: async (startDate?: string, endDate?: string, siteId = 'global'): Promise<any> => {
        const { data } = await api.get('/analytics/tickets', { params: { startDate, endDate, siteId } });
        return data;
    },
    exportCSV: async (siteId = 'global', startDate: string, endDate: string) => {
        const response = await api.get('/analytics/export', { 
            params: { siteId, startDate, endDate },
            responseType: 'blob' 
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `rapport_gesparc_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
    }
};
