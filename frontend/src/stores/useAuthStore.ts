import { create } from 'zustand';
import { persist } from 'zustand/middleware';



export type UserRole = 'SUPERVISOR' | 'MANAGER' | 'AGENT_QUAI' | 'ADMINISTRATOR' | 'EXPLOITATION';

interface User {
    userId: string;
    username: string;
    role: UserRole;
    email: string;
    siteId?: string; // Associated site
    assignedQueueId?: string; // New field for isolation
    quaiId?: string; // Direct access to associated quai
    queue?: {
        name: string;
        quaiId?: string;
    };
    department?: string;
    permissions?: string[];
    rules?: any[];
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    activeQuaiId: string | null;
    activeCategoryId: string | null;
    setAuth: (user: User, token: string) => void;
    setToken: (token: string) => void;
    logout: () => void;
    setActiveTerritory: (quaiId: string, categoryId: string) => void;
    clearActiveTerritory: () => void;
    // Helper Methods
    hasRole: (roles: UserRole[]) => boolean;
    hasPermission: (permission: string) => boolean;
    isAdmin: () => boolean;
    isSupervisor: () => boolean;
    isManager: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            activeQuaiId: null,
            activeCategoryId: null,
            setAuth: (user: User, token: string) => {
                set({ user, token, isAuthenticated: true });
            },
            setToken: (token: string) => {
                set({ token, isAuthenticated: !!token });
            },
            logout: () => {
                set({ user: null, token: null, isAuthenticated: false, activeQuaiId: null, activeCategoryId: null });
            },
            setActiveTerritory: (quaiId: string, categoryId: string) => {
                set({ activeQuaiId: quaiId, activeCategoryId: categoryId });
            },
            clearActiveTerritory: () => {
                set({ activeQuaiId: null, activeCategoryId: null });
            },
            hasRole: (roles: UserRole[]) => {
                const user = get().user;
                return user ? roles.includes(user.role) : false;
            },
            hasPermission: (permission: string) => {
                const user = get().user;
                if (!user) return false;
                if (user.role === 'ADMINISTRATOR') return true; // Implicit Admin Access
                return user.permissions?.includes(permission) || false;
            },
            isAdmin: () => get().user?.role === 'ADMINISTRATOR',
            isSupervisor: () => get().user?.role === 'SUPERVISOR',
            isManager: () => get().user?.role === 'MANAGER',
        }),
        {
            name: 'gesparc-auth-storage',
            partialize: (state) => ({ 
                user: state.user, 
                token: state.token, 
                isAuthenticated: state.isAuthenticated,
                activeQuaiId: state.activeQuaiId,
                activeCategoryId: state.activeCategoryId
            }),
        }
    )
);
