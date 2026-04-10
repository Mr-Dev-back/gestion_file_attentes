import { useManagerStats } from '../hooks/useDashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../components/molecules/ui/card';
import { Loader2, TrendingUp, Clock, CheckCircle, Truck } from 'lucide-react';

export default function Reporting() {
    // Fetch global stats (no department filter = ALL)
    const { data: stats, isLoading } = useManagerStats();

    if (isLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (!stats) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Rapports & Analyses</h2>

            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-2xl shadow-sm border-0 bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Volume Aujourd'hui</CardTitle>
                        <Truck className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.todayTickets}</div>
                        <p className="text-xs text-muted-foreground">Camions enregistrés</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-0 bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">En Attente</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingTickets}</div>
                        <p className="text-xs text-muted-foreground">Actuellement sur site</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-0 bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Terminés</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completedToday}</div>
                        <p className="text-xs text-muted-foreground">Cycle complet</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-0 bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Temps Moyen</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgWaitTime} min</div>
                        <p className="text-xs text-muted-foreground">Attente avant chargement</p>
                    </CardContent>
                </Card>
            </div>

            {/* Future Charts Section */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="rounded-2xl shadow-sm border-0 bg-white">
                    <CardHeader>
                        <CardTitle>Performance Globale</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground italic border-2 border-dashed rounded-xl">
                            Graphique d'évolution (À venir)
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
