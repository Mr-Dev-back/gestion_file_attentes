import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionApi, type Permission } from '../services/permissionApi';

export const usePermissions = () => {
    const queryClient = useQueryClient();

    const permissionsQuery = useQuery({
        queryKey: ['permissions'],
        queryFn: permissionApi.getAll
    });

    const resourcesQuery = useQuery({
        queryKey: ['permission-resources'],
        queryFn: permissionApi.getResources,
        staleTime: 3600000 // 1 hour
    });

    const actionsQuery = useQuery({
        queryKey: ['permission-actions'],
        queryFn: permissionApi.getActions,
        staleTime: 3600000 // 1 hour
    });

    const createPermission = useMutation({
        mutationFn: (data: Partial<Permission>) => permissionApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
        }
    });

    const updatePermission = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Permission> }) => permissionApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
        }
    });

    const deletePermission = useMutation({
        mutationFn: (id: string) => permissionApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
        }
    });

    const bulkDeletePermissions = useMutation({
        mutationFn: async (ids: string[]) => {
            await Promise.all(ids.map(id => permissionApi.delete(id)));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
        }
    });

    const createResource = useMutation({
        mutationFn: (data: any) => permissionApi.createResource(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permission-resources'] });
            queryClient.invalidateQueries({ queryKey: ['permissions'] }); // High impact on matrix
        }
    });

    const updateResource = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => permissionApi.updateResource(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permission-resources'] });
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
        }
    });

    const deleteResource = useMutation({
        mutationFn: (id: string) => permissionApi.deleteResource(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permission-resources'] });
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
        }
    });

    const bulkDeleteResources = useMutation({
        mutationFn: (ids: string[]) => permissionApi.bulkDeleteResources(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permission-resources'] });
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
        }
    });

    return {
        permissions: permissionsQuery.data || [],
        resources: resourcesQuery.data || [],
        actions: actionsQuery.data || [],
        isLoading: permissionsQuery.isLoading || resourcesQuery.isLoading || actionsQuery.isLoading,
        error: permissionsQuery.error || resourcesQuery.error || actionsQuery.error,
        createPermission,
        updatePermission,
        deletePermission,
        bulkDeletePermissions,
        createResource,
        updateResource,
        deleteResource,
        bulkDeleteResources
    };
};
