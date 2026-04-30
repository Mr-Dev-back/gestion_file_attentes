import { api } from './api';

export const dashboardApi = {
    // Admin endpoints
    getAdminStats: () => api.get('/dashboard/admin/stats'),
    getAdminRecentActivity: () => api.get('/dashboard/admin/recent-activity'),
    getAdminOverview: (siteId?: string) => api.get('/dashboard/admin/overview', { params: { siteId } }),

    // Supervisor endpoints
    getSupervisorStats: (siteId?: string) => api.get('/dashboard/supervisor/stats', { params: { siteId } }),
    getSupervisorDepartments: (siteId?: string) => api.get('/dashboard/supervisor/departments', { params: { siteId } }),
    getSupervisorQueues: (siteId: string) => api.get('/dashboard/supervisor/queues', { params: { siteId } }),

    // Manager endpoints
    getManagerStats: (department?: string) =>
        api.get('/dashboard/manager/stats', { params: { department } }),
    getManagerPerformance: (department?: string) =>
        api.get('/dashboard/manager/performance', { params: { department } }),

    // Sales endpoints
    getSalesStats: () => api.get('/dashboard/sales/stats'),
    getSalesSummary: () => api.get('/dashboard/sales/summary'),

    // Control endpoints
    getControlStats: () => api.get('/dashboard/control/stats'),
    getControlPending: () => api.get('/dashboard/control/pending'),

    // Analytics (New CASL-based)
    getSummary: () => api.get('/analytics/summary'),
    getPerformance: () => api.get('/analytics/performance'),

    // Sites
    getSites: () => api.get('/sites'),
};
