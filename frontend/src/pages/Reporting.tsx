import { useEffect, useState } from 'react';
import { analyticsApi } from '../services/analyticsApi';
import StatCards from '../components/analytics/StatCards';
import PerformanceChart from '../components/analytics/PerformanceChart';
// @ts-ignore
import TicketLogTable from '../components/analytics/TicketLogTable';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { Card, CardContent } from '../components/molecules/ui/card';

export default function Reporting() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = user?.role === 'ADMINISTRATOR';

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const [statsData, logsData] = await Promise.all([
                analyticsApi.getDashboardStats('global'),
                analyticsApi.getTicketLogs('global')
            ]);
            
            console.log("Réponse API Stats:", statsData);
            setStats(statsData);
            setLogs(logsData || []);
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            setError("Impossible de charger les statistiques.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAdmin) return;
        
        fetchData();
        const interval = setInterval(fetchData, 300000); // 5 min
        return () => clearInterval(interval);
    }, [isAdmin]);

    if (!isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center p-6">
                <Card className="max-w-md w-full border-red-100 bg-red-50/50">
                    <CardContent className="flex flex-col items-center p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                        <h2 className="text-xl font-bold text-red-900">Accès refusé</h2>
                        <p className="text-red-700 mt-2">Vous n'avez pas les droits d'accès requis pour consulter cette page.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading && !stats) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
        );
    }

    if (error) {
        return <div className="p-6 text-center text-red-500 font-medium">{error}</div>;
    }

    return (
        <div className="space-y-6 p-6">
            <h2 className="text-2xl font-bold tracking-tight">Dashboard KPIs Opérationnels</h2>
            
            {stats?.summary && (
                <StatCards summary={{
                    ticketsToday: stats.summary.ticketsToday ?? 0,
                    avgWaitingTime: stats.summary.waitingTime?.avg ?? "0",
                    avgProcessingTime: stats.summary.processingTime?.avg ?? "0",
                    avgTotalTime: stats.summary.totalTime?.avg ?? "0",
                    trucksInQueue: stats.summary.trucksInQueue ?? 0,
                    trucksInLoading: stats.summary.trucksInLoading ?? 0,
                    quaiOccupationRate: stats.summary.quaiOccupationRate ?? "0"
                }} />
            )}

            <TicketLogTable logs={logs || []} />
        </div>
    );
}
