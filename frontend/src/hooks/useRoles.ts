import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi, type CreateRoleDTO } from '../services/roleApi';

export const useRoles = () => {
    const queryClient = useQueryClient();

    const rolesQuery = useQuery({
        queryKey: ['roles'],
        queryFn: roleApi.getAll
    });

    const createRole = useMutation({
        mutationFn: (data: CreateRoleDTO) => roleApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        }
    });

    const updateRole = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateRoleDTO> }) => roleApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        }
    });

    const deleteRole = useMutation({
        mutationFn: (id: string) => roleApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        }
    });

    const updateRolePermissions = useMutation({
        mutationFn: ({ id, permissionIds }: { id: string; permissionIds: string[] }) => roleApi.updatePermissions(id, permissionIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        }
    });

    return {
        roles: rolesQuery.data || [],
        isLoading: rolesQuery.isLoading,
        error: rolesQuery.error,
        createRole,
        updateRole,
        deleteRole,
        updateRolePermissions
    };
};
