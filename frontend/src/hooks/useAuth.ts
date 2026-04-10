
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole } from '../utils/roleBasedRouting';

export const useAuth = () => {
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();

    const loginMutation = useMutation({
        mutationFn: async (credentials: any) => {
            const response = await api.post('/auth/login', credentials);
            return response.data;
        },
        onSuccess: (data) => {
            if (data.token) {
                setAuth(data.user, data.token);
                // Token also managed by HttpOnly cookie for API calls
                const defaultRoute = getDefaultRouteForRole(data.user.role);
                navigate(defaultRoute);
            } else {
                console.error("Login successful but no token received");
            }
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (userData: any) => {
            const response = await api.post('/auth/register', userData);
            return response.data;
        },
        onSuccess: () => {
            // Registration doesn't auto-login currently
            navigate('/login');
        },
    });

    return {
        login: loginMutation,
        register: registerMutation,
    };
};
