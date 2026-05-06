// Dashboard Type Definitions

/**
 * Pending ticket for control dashboard
 */
export interface PendingTicket {
    ticketId: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    time: string;
}

/**
 * Control dashboard pending response
 */
export interface ControlPendingResponse {
    tickets: PendingTicket[];
}

/**
 * Control dashboard stats
 */
export interface ControlStatsResponse {
    toControl: number;
    approved: number;
    rejected: number;
    complianceRate: number;
}

/**
 * Admin dashboard stats
 */
export interface AdminStatsResponse {
    totalTickets: number;
    activeTickets: number;
    resolvedTickets: number;
    avgResolutionTime: string;
    activeUsers: number;
    todayEntries: number;
}

/**
 * Recent activity item
 */
export interface RecentActivity {
    auditLogId: string;
    type: string;
    description: string;
    timestamp: string;
    user: string;
}

/**
 * Admin recent activity response
 */
export interface AdminRecentActivityResponse {
    activities: RecentActivity[];
}

/**
 * Supervisor stats response
 */
export interface SupervisorStatsResponse {
    totalTickets: number;
    activeTickets: number;
    departments: number;
    alerts: number;
    pendingAssignment: number;
    inProgress: number;
    avgResponseTime: string;
}

/**
 * Department performance
 */
export interface DepartmentPerformance {
    name: string;
    activeTickets: number;
    avgResolutionTime: string;
    tickets: number;
    pending: number;
    completed: number;
    color: string;
}

/**
 * Supervisor departments response
 */
export interface SupervisorDepartmentsResponse {
    departments: DepartmentPerformance[];
}

/**
 * Manager stats response
 */
export interface ManagerStatsResponse {
    todayTickets: number;
    pendingTickets: number;
    completedToday: number;
    avgWaitTime: number;
}

/**
 * Performance metric
 */
export interface PerformanceMetric {
    metric: string;
    value: string | number;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

/**
 * Manager performance response
 */
export interface ManagerPerformanceResponse {
    metrics: PerformanceMetric[];
    completionRate: number;
    efficiency: number;
    satisfaction: number;
}

/**
 * Sales stats response
 */
export interface SalesStatsResponse {
    todaySales: number;
    pendingInvoices: number;
    completedToday: number;
    avgTicketValue: number;
}

/**
 * Sales summary item
 */
export interface SalesSummaryItem {
    saleId: string; // Assuming saleId, or generic id if not backed by specific table yet
    customer: string;
    amount: number;
    status: string;
    date: string;
}

/**
 * Sales summary response
 */
export interface SalesSummaryResponse {
    today: number;
    week: number;
    month: number;
    monthlyGoal: number;
    goalProgress: number;
}
export interface SupervisorQueueResponse {
    queueId: string;
    name: string;
    siteId?: string;
    siteName?: string;
    truckCount: number;
    category?: {
        categoryId: string;
        name: string;
        color: string;
    };
    tickets: Array<{
        ticketId: string;
        ticketNumber: string;
        priority: 'NORMAL' | 'URGENT' | 'CRITIQUE';
        status: string;
        createdAt?: string;
        arrivedAt?: string;
        position: number;
        estimatedWaitTime: number;
        categories?: Array<{ name: string; color: string }>;
        vehicleInfo?: {
            licensePlate: string;
            truckType: string;
        };
        logistic?: {
            grossWeight?: number;
            tareWeight?: number;
            netWeight?: number;
        };
    }>;
}

/**
 * Admin Overview Response
 */
export interface AdminOverviewResponse {
    vitals: {
        api: 'healthy' | 'unhealthy' | 'degraded';
        database: 'healthy' | 'unhealthy' | 'degraded';
        realtime: 'healthy' | 'unhealthy' | 'degraded';
        vocal: 'healthy' | 'unhealthy' | 'degraded';
    };
    kpis: {
        activeSessions: number;
        activeTickets: number;
        apiErrorRate: number;
        criticalAlerts: number;
    };
    hardware: Array<{
        kioskId: string;
        name: string;
        kioskType: string;
        status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
        ipAddress: string;
        site?: { name: string };
        capabilities?: { hasPrinter: boolean; hasScale: boolean };
    }>;
    auditStream: Array<{
        id: string;
        user: string;
        action: string;
        details: string;
        timestamp: string;
        color: string;
    }>;
    charts: {
        ticketTrend: Array<{ time: string; count: number }>;
        categoryDistribution: Array<{ name: string; value: number; color: string }>;
    };
}
