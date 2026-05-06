import { type UserRole } from '../stores/useAuthStore';

/**
 * Returns the default route for a given user role after login
 */
export const getDefaultRouteForRole = (user: any): string => {
    const role = user?.role as UserRole;
    
    // Si c'est un agent opérationnel (Quai, Guérite, Bascule, etc.)
    if (role === 'AGENT_QUAI') {
        const quaiId = user.quaiId || user.queue?.quaiId; 
        
        if (quaiId) {
            return `/quai/${quaiId}`;
        }
        return '/operational';
    }

    if (role === 'AGENT_GUERITE') {
        return '/operational';
    }

    const roleRoutes: Record<string, string> = {
        ADMINISTRATOR: '/dashboard/admin',
        SUPERVISOR: '/supervisor',
        MANAGER: '/manager',
        EXPLOITATION: '/operational',
    };

    return roleRoutes[role] || '/';
};

/**
 * Returns a user-friendly label for a given role
 */
export const getRoleLabel = (role: UserRole): string => {
    const roleLabels: Record<UserRole, string> = {
        ADMINISTRATOR: 'Administrateur',
        SUPERVISOR: 'Superviseur',
        MANAGER: 'Manager',
        EXPLOITATION: 'Exploitation',
        AGENT_QUAI: 'Agent Opérationnel (Quai/Bascule)',
        AGENT_GUERITE: 'Agent Guérite',
    };

    return roleLabels[role] || role;
};
