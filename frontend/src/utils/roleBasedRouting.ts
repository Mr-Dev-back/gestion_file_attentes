import { type UserRole } from '../stores/useAuthStore';

/**
 * Returns the default route for a given user role after login
 */
export const getDefaultRouteForRole = (user: any): string => {
    const role = user?.role as UserRole;
    
    // Si c'est un agent de quai, on cherche son quaiId
    if (role === 'AGENT_QUAI' || role === 'EXPLOITATION') {
        // IMPORTANT: On utilise le quaiId direct envoyé par le backend ou celui de l'objet queue
        const quaiId = user.quaiId || user.queue?.quaiId; 
        
        if (quaiId) {
            return `/quai/${quaiId}`;
        }
        return '/operational'; // Vue opérationnelle globale si aucun quai physique n'est rattaché
    }

    const roleRoutes: Record<string, string> = {
        ADMINISTRATOR: '/dashboard/admin',
        SUPERVISOR: '/supervisor',
        MANAGER: '/manager',
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
        AGENT_QUAI: 'Agent de Quai',
        EXPLOITATION: 'Exploitation',
    };

    return roleLabels[role] || role;
};
