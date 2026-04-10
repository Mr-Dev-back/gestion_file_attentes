import { useAuthStore } from '../../stores/useAuthStore';
import { StatCard } from '../../components/organisms/dashboard/StatCard';
import { QuickActionCard } from '../../components/organisms/dashboard/QuickActionCard';
import { RecentActivityList } from '../../components/organisms/dashboard/RecentActivityList';
import { useManagerStats, useManagerPerformance, useSupervisorQueues } from '../../hooks/useDashboardStats';
import { ConnectionStatus } from '../../components/atoms/ui/ConnectionStatus';
import { useSocket, useSocketEvent } from '../../hooks/useSocketEvent';
import {
    Truck,
    Activity,
    TrendingUp,
    Users,
    List,
    BarChart3,
    FileText,
    LayoutDashboard,
    MapPin,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { Card } from '../../components/molecules/ui/card';
import { Button } from '../../components/atoms/ui/button';
import { useNavigate } from 'react-router-dom';

export default function ManagerDashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { state: socketState } = useSocket();
    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useManagerStats(user?.department);
    const { data: performance, isLoading: perfLoading } = useManagerPerformance(user?.department);
    const { data: siteQueues, isLoading: queuesLoading, refetch: refetchQueues } = useSupervisorQueues(''); // Empty for ALL sites

    useSocketEvent('ticket_updated', () => { refetchStats(); refetchQueues(); });
    useSocketEvent('ticket_created', () => { refetchStats(); refetchQueues(); });

    const departmentLabel = user?.department === 'INFRA' ? 'Infrastructure' :
        user?.department === 'BATIMENT' ? 'Bâtiment' :
            user?.department === 'ELECT' ? 'Électricité' : 'Tous';

    if (statsLoading || perfLoading || queuesLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                    <p className="text-text-muted font-black uppercase tracking-widest text-xs animate-pulse">Initialisation Dashboard...</p>
                </div>
            </div>
        );
    }

    const recentActivities = [
        {
            id: '1',
            title: 'Analyse Globale',
            description: `Vue consolidée de SIBM Group`,
            timestamp: 'En temps réel',
            type: 'info' as const
        }
    ];

    return (
        <div className="p-6 space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm border border-white/20">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary text-white rounded-3xl shadow-xl shadow-primary/20 transform -rotate-3">
                        <LayoutDashboard className="h-8 w-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-text-main tracking-tighter">
                                Manager Central
                            </h1>
                            <ConnectionStatus state={socketState} />
                        </div>
                        <p className="text-text-muted font-bold mt-1 uppercase tracking-widest text-xs opacity-70">
                            Supervision Globale • SIBM Group
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-text-main">{user?.username}</p>
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">{departmentLabel}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg border-2 border-white/50" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tickets Aujourd'hui"
                    value={stats?.todayTickets || 0}
                    icon={Truck}
                    trend={{ value: 15, isPositive: true }}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    title="En Attente"
                    value={stats?.pendingTickets || 0}
                    icon={Activity}
                    iconColor="text-orange-600"
                    iconBgColor="bg-orange-100"
                />
                <StatCard
                    title="Complétés"
                    value={stats?.completedToday || 0}
                    icon={TrendingUp}
                    trend={{ value: 8, isPositive: true }}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    title="Temps Moyen"
                    value={`${stats?.avgWaitTime || 0}min`}
                    icon={Activity}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />
            </div>

                    {/* État des Sites (NEW) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-text-main uppercase tracking-tighter flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Disponibilité par Site
                    </h2>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate('/queue')}
                        className="text-primary font-black uppercase tracking-widest text-[10px]"
                    >
                        Détails complets <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {siteQueues && Object.values(
                        siteQueues.reduce((acc, q) => {
                            const sId = q.siteId || 'unknown';
                            const sName = q.siteName || 'Site Inconnu';
                            if (!acc[sId]) acc[sId] = { name: sName, trucks: 0, critical: 0 };
                            acc[sId].trucks += q.truckCount;
                            if (q.tickets.some(t => t.priority === 'CRITIQUE')) acc[sId].critical++;
                            return acc;
                        }, {} as Record<string, {name: string, trucks: number, critical: number}>)
                    ).map((site, idx) => (
                        <Card 
                            key={idx} 
                            onClick={() => navigate(`/queue`)}
                            className="p-5 border-0 bg-white/60 backdrop-blur-md rounded-3xl shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                {site.critical > 0 && (
                                    <div className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black items-center flex gap-1 animate-pulse">
                                        <Activity className="h-3 w-3 " /> ALERT
                                    </div>
                                )}
                            </div>
                            <h4 className="font-black text-text-main tracking-tight text-lg mb-1">{site.name}</h4>
                            <div className="flex items-center justify-between">
                                <span className="text-text-muted text-[10px] font-black uppercase tracking-widest">Occupation</span>
                                <span className="text-primary font-black text-lg">{site.trucks} camions</span>
                            </div>
                            <div className="mt-3 w-full bg-primary/5 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${site.trucks > 10 ? 'bg-orange-500' : 'bg-primary'}`} 
                                    style={{ width: `${Math.min(100, (site.trucks / 20) * 100)}%` }} 
                                />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <h2 className="text-xl font-black text-text-main uppercase tracking-tighter">Commandes de Pilotage</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <QuickActionCard
                        title="Supervision Temps Réel"
                        description="Accès direct aux files d'attente de tous les sites"
                        icon={List}
                        href="/queue"
                        iconColor="text-white"
                        iconBgColor="bg-blue-600"
                    />
                    <QuickActionCard
                        title="Analyse Performance"
                        description="Statistiques de débit et temps de cycle"
                        icon={BarChart3}
                        href="/queue"
                        iconColor="text-white"
                        iconBgColor="bg-purple-600"
                    />
                    <QuickActionCard
                        title="Exports Logistiques"
                        description="Générer les rapports d'activité journaliers"
                        icon={FileText}
                        href="/queue"
                        iconColor="text-white"
                        iconBgColor="bg-orange-600"
                    />
                </div>
            </div>

            {/* Summary & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <RecentActivityList activities={recentActivities} />
                </div>

                {/* Department Performance */}
                <Card className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border-white/20 shadow-sm border-0">
                    <h3 className="text-xl font-black text-text-main mb-6 flex items-center gap-3">
                        <Users className="h-6 w-6 text-primary" />
                        Indicateurs Performance
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Taux de Complétion</span>
                                <span className="text-sm font-black text-text-main">{performance?.completionRate || 0}%</span>
                            </div>
                            <div className="w-full bg-primary/5 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" style={{ width: `${performance?.completionRate || 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Efficacité Opérationnelle</span>
                                <span className="text-sm font-black text-text-main">{performance?.efficiency || 0}%</span>
                            </div>
                            <div className="w-full bg-primary/5 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.4)]" style={{ width: `${performance?.efficiency || 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Score Qualité / Service</span>
                                <span className="text-sm font-black text-text-main">{performance?.satisfaction || 0}%</span>
                            </div>
                            <div className="w-full bg-primary/5 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.4)]" style={{ width: `${performance?.satisfaction || 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
