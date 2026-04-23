import { api } from './api';

export interface Resource {
    resourceId: string;
    name: string;
    slug: string;
    description: string;
    permissionCount?: number;
    createdAt?: string;
}

export interface Action {
    actionId: string;
    name: string;
    slug: string;
    description: string;
}

export interface Permission {
    permissionId: string;
    name: string;
    guardName?: string;
    code: string;
    description: string;
    resourceId: string;
    actionId: string;
    action?: string;
    subject?: string;
    conditions?: Record<string, unknown> | null;
    resourceObj?: Resource;
    actionObj?: Action;
}

export const permissionApi = {
    getAll: async () => {
        const response = await api.get<Permission[]>('/permissions');
        return response.data;
    },
    getResources: async () => {
        const response = await api.get<Resource[]>('/permissions/resources');
        return response.data;
    },
    getActions: async () => {
        const response = await api.get<Action[]>('/permissions/actions');
        return response.data;
    },
    create: async (data: Partial<Permission>) => {
        const response = await api.post<Permission>('/permissions', data);
        return response.data;
    },
    update: async (id: string, data: Partial<Permission>) => {
        const response = await api.put<Permission>(`/permissions/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        await api.delete(`/permissions/${id}`);
    },
    // Resource Management
    createResource: async (data: Partial<Resource>) => {
        const response = await api.post<Resource>('/permissions/resources', data);
        return response.data;
    },
    updateResource: async (id: string, data: Partial<Resource>) => {
        const response = await api.put<Resource>(`/permissions/resources/${id}`, data);
        return response.data;
    },
    deleteResource: async (id: string) => {
        await api.delete(`/permissions/resources/${id}`);
    },
    bulkDeleteResources: async (ids: string[]) => {
        await api.delete('/permissions/resources/bulk', { data: { ids } });
    }
};
