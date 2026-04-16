import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/organisms/layout/Sidebar';
import { Topbar } from '../components/organisms/layout/Topbar';
import { Breadcrumbs } from '../components/atoms/ui/breadcrumbs';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { cn } from '../lib/utils';
import { Toaster, toast } from 'sonner';

export function MainLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const { user } = useAuthStore();
    const { addNotification } = useNotificationStore();

    // Responsive auto-collapse
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setCollapsed(true);
            } else {
                setCollapsed(false);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime); // High pitch for ping
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1); 

            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.warn('Audio notification failed:', e);
        }
    };

    useSocketEvent('new-ticket', (data: any) => {
        const title = 'Nouveau Camion';
        const message = `Le camion ${data.licensePlate} (${data.ticketNumber}) vient d'arriver.`;
        
        addNotification({ title, message, type: 'info' });
        toast.info(title, { description: message });

        if (user?.role === 'AGENT_QUAI' || user?.role === 'ADMINISTRATOR') {
            playNotificationSound();
        }
    });

    useSocketEvent('ticket-status-updated', (data: any) => {
        let message = '';
        let type: 'info' | 'success' | 'warning' | 'error' = 'info';

        switch (data.status) {
            case 'APPELÉ':
                message = `Le camion ${data.ticketNumber} est appelé vers zone ${data.zone || 'de chargement'}.`;
                type = 'success';
                break;
            case 'PESÉ_ENTRÉE':
                message = `Première pesée effectuée pour ${data.ticketNumber}.`;
                if (user?.role === 'AGENT_QUAI' || user?.role === 'ADMINISTRATOR') {
                    playNotificationSound();
                }
                break;
            case 'PESÉ_SORTIE':
                message = `Pesée de sortie terminée pour ${data.ticketNumber}.`;
                type = 'success';
                break;
            case 'TERMINÉ':
                message = `Le ticket ${data.ticketNumber} est clôturé.`;
                break;
        }

        if (message) {
            addNotification({ title: 'Mise à jour Ticket', message, type });
            if (type === 'success') toast.success(message);
            else toast.info(message);
        }
    });

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-background flex selection:bg-primary/30 selection:text-primary">
            <Toaster position="top-right" richColors closeButton />
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

            <div className={cn(
                "flex-1 flex flex-col transition-all duration-500 min-h-screen",
                collapsed ? "pl-20" : "pl-64"
            )}>
                <Topbar />
                <main className="flex-1 p-6 md:p-10 overflow-auto bg-slate-50/50">
                    <div className="max-w-7xl mx-auto">
                        <Breadcrumbs />
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
