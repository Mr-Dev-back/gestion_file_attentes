import { api } from './api';
import type { Permission } from './permissionApi';

export interface Role {
    roleId: string;
    name: string;
    guardName: string;
    description: string;
    scope: 'GLOBAL' | 'COMPANY' | 'SITE';
    permissions?: Permission[];
}

export interface CreateRoleDTO {
    name: string;
    guardName?: string;
    description?: string;
    scope: 'GLOBAL' | 'COMPANY' | 'SITE';
    permissionIds?: string[];
}

export const roleApi = {
    getAll: async () => {
        const response = await api.get<Role[]>('/roles');
        return response.data;
    },
    create: async (data: CreateRoleDTO) => {
        const response = await api.post<Role>('/roles', data);
        return response.data;
    },
    update: async (id: string, data: Partial<CreateRoleDTO>) => {
        const response = await api.put<Role>(`/roles/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        await api.delete(`/roles/${id}`);
    },
    updatePermissions: async (id: string, permissionIds: string[]) => {
        const response = await api.patch(`/roles/${id}/permissions`, { permissionIds });
        return response.data;
    }
};
