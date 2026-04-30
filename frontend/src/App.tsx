import { useEffect } from 'react';
import type { AxiosError } from 'axios';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { queryClient } from './lib/queryClient';
import { api } from './services/api';
import { useAuthStore } from './stores/useAuthStore';
import Login from './pages/Login';
import Entry from './pages/Entry';
import Admin from './pages/Admin';
import OperationalDashboard from './pages/OperationalDashboard';
import PublicTV from './pages/PublicTV';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import Supervisor from './pages/Supervisor';
import QueueView from './pages/QueueView';
import Reporting from './pages/Reporting';
import Manager from './pages/Manager';
import SmartQuai from './pages/SmartQuai';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/organisms/auth/ProtectedRoute';
import { SocketProvider } from './providers/SocketProvider';
import { AbilityProvider } from './auth/AbilityContext';
import { updateAbility } from './auth/ability';

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const token = useAuthStore(state => state.token);
  const setAuth = useAuthStore(state => state.setAuth);
  const logout = useAuthStore(state => state.logout);

  useEffect(() => {
    const syncAuth = async () => {
      if (isAuthenticated && token) {
        try {
          const { data } = await api.get('/auth/me');
          // The backend /auth/me returns the user object directly, not wrapped in { user: ... }
          const fetchedUser = data.user || data; 
          
          if (fetchedUser && fetchedUser.userId) {
             setAuth(fetchedUser, token);
             // Mise à jour des capacités CASL avec les règles réelles (rules)
             if (fetchedUser.rules) {
               updateAbility(fetchedUser.rules);
             }
          }
        } catch (error) {
          const apiError = error as AxiosError;
          if (apiError.response?.status === 401 || apiError.response?.status === 403) {
            logout();
          }
        }
      }
    };
    syncAuth();
  }, [isAuthenticated, token, setAuth, logout]);


  return (
    <QueryClientProvider client={queryClient}>
      <AbilityProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Entry />} />
              <Route path="/tv" element={<PublicTV />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Standalone full-screen routes (no sidebar/topbar) */}
              <Route path="/quai/:quaiId" element={
                  <ProtectedRoute allowedRoles={['AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR', 'EXPLOITATION']}>
                    <SmartQuai />
                  </ProtectedRoute>
              } />

              <Route element={<MainLayout />}>
                {/* Dashboard Routes */}
                <Route path="/dashboard/admin" element={
                  <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/supervisor/*" element={
                  <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMINISTRATOR']}>
                    <Supervisor />
                  </ProtectedRoute>
                } />

                <Route path="/manager/*" element={
                  <ProtectedRoute allowedRoles={['MANAGER', 'ADMINISTRATOR']}>
                    <Manager />
                  </ProtectedRoute>
                } />

                {/* Operational & Agent Routes */}
                <Route path="/operational" element={
                  <ProtectedRoute allowedRoles={['AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR', 'EXPLOITATION']}>
                    <OperationalDashboard
                      title="Poste Opérationnel"
                      description="Traitement des tickets selon le workflow"
                    />
                  </ProtectedRoute>
                } />
                
                <Route path="/reporting" element={
                  <ProtectedRoute allowedRoles={['ADMINISTRATOR', 'SUPERVISOR', 'MANAGER']}>
                    <Reporting />
                  </ProtectedRoute>
                } />

                {/* Existing Routes */}
                <Route path="/admin/*" element={
                  <ProtectedRoute allowedRoles={['ADMINISTRATOR', 'SUPERVISOR']}>
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="/queue" element={
                  <ProtectedRoute allowedRoles={['ADMINISTRATOR', 'SUPERVISOR', 'MANAGER', 'EXPLOITATION', 'AGENT_QUAI']}>
                    <QueueView />
                  </ProtectedRoute>
                } />
              </Route>

              {/* Catch-all route for 404 - Must be outside MainLayout */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AbilityProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
