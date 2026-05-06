import { api } from './api';

export const dashboardApi = {
    // Admin endpoints
    getAdminStats: () => api.get('/dashboard/admin/stats'),
    getAdminRecentActivity: () => api.get('/dashboard/admin/recent-activity'),
    getAdminOverview: (siteId?: string) => api.get('/dashboard/admin/overview', { params: { siteId } }),

    // Supervisor endpoints
    getSupervisorStats: (siteId?: string) => api.get('/dashboard/supervisor/stats', { params: { siteId } }),
    getSupervisorDepartments: (siteId?: string) => api.get('/dashboard/supervisor/departments', { params: { siteId } }),
    getSupervisorQueues: (siteId?: string) =>
        api.get('/dashboard/supervisor/queues', { params: siteId ? { siteId } : {} }),

    // Manager endpoints
    getManagerStats: (siteId?: string) =>
        api.get('/dashboard/manager/stats', { params: (siteId && siteId !== '') ? { siteId } : {} }),
    getManagerPerformance: (siteId?: string) =>
        api.get('/dashboard/manager/performance', { params: (siteId && siteId !== '') ? { siteId } : {} }),
    getManagerDistribution: (siteId?: string) =>
        api.get('/dashboard/manager/distribution', { params: (siteId && siteId !== '') ? { siteId } : {} }),
    getManagerSiteComparison: () =>
        api.get('/dashboard/manager/site-comparison'),
    getMapStats: () =>
        api.get('/dashboard/manager/map-stats'),

    // Sales endpoints
    getSalesStats: () => api.get('/dashboard/sales/stats'),
    getSalesSummary: () => api.get('/dashboard/sales/summary'),

    // Control endpoints
    getControlStats: () => api.get('/dashboard/control/stats'),
    getControlPending: () => api.get('/dashboard/control/pending'),

    // Analytics

    // Sites
    getSites: () => api.get('/sites'),
};
