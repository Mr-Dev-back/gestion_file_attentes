import { api } from './api';

export interface AuditFilters {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AuditLogEntry {
  auditId: string;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  oldValues: any | null;
  newValues: any | null;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
  user?: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface AuditLogsResponse {
  total: number;
  pages: number;
  currentPage: number;
  logs: AuditLogEntry[];
}

export const auditApi = {
  getLogs: async (filters: AuditFilters = {}): Promise<AuditLogsResponse> => {
    const { data } = await api.get<AuditLogsResponse>('/audit/logs', { params: filters });
    return data;
  },

  getActionTypes: async (): Promise<string[]> => {
    const { data } = await api.get<string[]>('/audit/actions');
    return data;
  }
};
