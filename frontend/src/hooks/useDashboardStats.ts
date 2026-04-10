import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboardApi';
import { useAuthStore } from '../stores/useAuthStore';
import type {
    AdminStatsResponse,
    AdminRecentActivityResponse,
    SupervisorStatsResponse,
    SupervisorDepartmentsResponse,
    ManagerStatsResponse,
    ManagerPerformanceResponse,
    SalesStatsResponse,
    SalesSummaryResponse,
    ControlStatsResponse,
    ControlPendingResponse,
    SupervisorQueueResponse,
    AdminOverviewResponse
} from '../types/dashboard';

// Refresh interval for dashboard data (30 seconds)
const DASHBOARD_REFRESH_INTERVAL = 30000;

/**
 * Admin Dashboard Hooks
 */
export const useAdminStats = () => {
    const { isAdmin, isAuthenticated } = useAuthStore();
    return useQuery<AdminStatsResponse>({
        queryKey: ['dashboard', 'admin', 'stats'],
        queryFn: async () => {
            const { data } = await dashboardApi.getAdminStats();
            return data;
        },
        enabled: isAuthenticated && isAdmin(),
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

export const useAdminRecentActivity = () => {
    const { isAdmin, isAuthenticated } = useAuthStore();
    return useQuery<AdminRecentActivityResponse>({
        queryKey: ['dashboard', 'admin', 'activity'],
        queryFn: async () => {
            const { data } = await dashboardApi.getAdminRecentActivity();
            return data;
        },
        enabled: isAuthenticated && isAdmin(),
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

export const useAdminOverview = (siteId?: string) => {
    const { isAdmin, isAuthenticated } = useAuthStore();
    return useQuery<AdminOverviewResponse>({
        queryKey: ['dashboard', 'admin', 'overview', siteId],
        queryFn: async () => {
            const { data } = await dashboardApi.getAdminOverview(siteId);
            return data;
        },
        enabled: isAuthenticated && isAdmin(),
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 10000,
    });
};

/**
 * Supervisor Dashboard Hooks
 */
export const useSupervisorStats = () => {
    const { hasRole, isAuthenticated } = useAuthStore();
    return useQuery<SupervisorStatsResponse>({
        queryKey: ['dashboard', 'supervisor', 'stats'],
        queryFn: async () => {
            const { data } = await dashboardApi.getSupervisorStats();
            return data;
        },
        enabled: isAuthenticated && hasRole(['SUPERVISOR', 'ADMINISTRATOR']),
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

export const useSupervisorDepartments = () => {
    const { hasRole, isAuthenticated } = useAuthStore();
    return useQuery<SupervisorDepartmentsResponse>({
        queryKey: ['dashboard', 'supervisor', 'departments'],
        queryFn: async () => {
            const { data } = await dashboardApi.getSupervisorDepartments();
            return data;
        },
        enabled: isAuthenticated && hasRole(['SUPERVISOR', 'ADMINISTRATOR']),
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

export const useSupervisorQueues = (siteId: string) => {
    const { hasRole, isAuthenticated } = useAuthStore();
    return useQuery<SupervisorQueueResponse[]>({
        queryKey: ['dashboard', 'supervisor', 'queues', siteId],
        queryFn: async () => {
            const { data } = await dashboardApi.getSupervisorQueues(siteId);
            return data;
        },
        enabled: !!siteId && isAuthenticated && hasRole(['SUPERVISOR', 'ADMINISTRATOR']),
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 10000, // Frequent updates for queues
    });
};

/**
 * Manager Dashboard Hooks
 */
export const useManagerStats = (department?: string) => {
    const { hasRole, isAuthenticated } = useAuthStore();
    return useQuery<ManagerStatsResponse>({
        queryKey: ['dashboard', 'manager', 'stats', department],
        queryFn: async () => {
            const { data } = await dashboardApi.getManagerStats(department);
            return data;
        },
        enabled: isAuthenticated && hasRole(['MANAGER', 'SUPERVISOR', 'ADMINISTRATOR']),
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

export const useManagerPerformance = (department?: string) => {
    const { hasRole, isAuthenticated } = useAuthStore();
    return useQuery<ManagerPerformanceResponse>({
        queryKey: ['dashboard', 'manager', 'performance', department],
        queryFn: async () => {
            const { data } = await dashboardApi.getManagerPerformance(department);
            return data;
        },
        enabled: isAuthenticated && hasRole(['MANAGER', 'SUPERVISOR', 'ADMINISTRATOR']),
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

/**
 * Sales Dashboard Hooks
 */
export const useSalesStats = () => {
    const { hasRole, isAuthenticated } = useAuthStore();
    return useQuery<SalesStatsResponse>({
        queryKey: ['dashboard', 'sales', 'stats'],
        queryFn: async () => {
            const { data } = await dashboardApi.getSalesStats();
            return data;
        },
        enabled: isAuthenticated && hasRole(['AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR']),
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

export const useSalesSummary = () => {
    const { hasRole, isAuthenticated } = useAuthStore();
    return useQuery<SalesSummaryResponse>({
        queryKey: ['dashboard', 'sales', 'summary'],
        queryFn: async () => {
            const { data } = await dashboardApi.getSalesSummary();
            return data;
        },
        enabled: isAuthenticated && hasRole(['AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR']),
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

/**
 * Control Dashboard Hooks
 */
export const useControlStats = () => {
    const { hasRole, isAuthenticated } = useAuthStore();
    return useQuery<ControlStatsResponse>({
        queryKey: ['dashboard', 'control', 'stats'],
        queryFn: async () => {
            const { data } = await dashboardApi.getControlStats();
            return data;
        },
        enabled: isAuthenticated && hasRole(['AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR', 'EXPLOITATION']),
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

export const useControlPending = () => {
    const { hasRole, isAuthenticated } = useAuthStore();
    return useQuery<ControlPendingResponse>({
        queryKey: ['dashboard', 'control', 'pending'],
        queryFn: async () => {
            const { data } = await dashboardApi.getControlPending();
            return data;
        },
        enabled: isAuthenticated && hasRole(['AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR', 'EXPLOITATION']),
        refetchInterval: DASHBOARD_REFRESH_INTERVAL,
        staleTime: 20000,
    });
};

export const useSites = () => {
    const { isAuthenticated } = useAuthStore();
    return useQuery<any[]>({
        queryKey: ['sites'],
        queryFn: async () => {
            const { data } = await dashboardApi.getSites();
            return data;
        },
        enabled: isAuthenticated,
        staleTime: 60000,
    });
};
