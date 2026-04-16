import { useAuthStore } from '../../stores/useAuthStore';
import { StatCard } from '../../components/organisms/dashboard/StatCard';
import { QuickActionCard } from '../../components/organisms/dashboard/QuickActionCard';
import { useSupervisorStats, useSupervisorDepartments, useSupervisorQueues } from '../../hooks/useDashboardStats';
import { useSocket, useSocketEvent } from '../../hooks/useSocketEvent';
import { ConnectionStatus } from '../../components/atoms/ui/ConnectionStatus';
import { Skeleton } from '../../components/atoms/ui/skeleton';
import {
    Truck,
    Activity,
    Building2,
    List,
    BarChart3,
    AlertTriangle
} from 'lucide-react';
import { Card } from '../../components/molecules/ui/card';

export default function SupervisorDashboard() {
    const { user } = useAuthStore();
    const { state: socketState } = useSocket();
    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useSupervisorStats();
    const { data: deptData, isLoading: deptLoading, refetch: refetchDepts } = useSupervisorDepartments();
    const siteId = user?.siteId || '';
    const { data: queuesData, isLoading: queuesLoading, refetch: refetchQueues } = useSupervisorQueues(siteId);

    // Real-time updates
    useSocketEvent('ticket_updated', () => {
        refetchStats();
        refetchQueues();
        refetchDepts();
    });

    useSocketEvent('ticket_created', () => {
        refetchStats();
        refetchQueues();
        refetchDepts();
    });

    useSocketEvent('queue_updated', () => {
        refetchQueues();
        refetchDepts();
    });

    if (statsLoading || deptLoading) {
        return <DashboardSkeleton />;
    }

    const departmentStats = deptData?.departments || [];
    const queues = queuesData || [];

    const priorityColors: Record<string, string> = {
        'CRITIQUE': 'bg-red-100 text-red-600 border-red-200',
        'URGENT': 'bg-orange-100 text-orange-600 border-orange-200',
        'NORMAL': 'bg-green-100 text-green-600 border-green-200',
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Tableau de Bord Superviseur
                        </h1>
                        <ConnectionStatus state={socketState} />
                    </div>
                    <p className="text-muted-foreground">
                        Bienvenue, {user?.username} - Vue multi-départements
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tickets Aujourd'hui"
                    value={stats?.todayTickets || 0}
                    icon={Truck}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    title="Tickets Actifs"
                    value={stats?.pendingTickets || 0}
                    icon={Activity}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    title="Complétés"
                    value={stats?.completedToday || 0}
                    icon={Building2}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />
                <StatCard
                    title="Temps Moyen"
                    value={`${stats?.avgWaitTime || 0} min`}
                    icon={AlertTriangle}
                    iconColor="text-red-600"
                    iconBgColor="bg-red-100"
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions Rapides</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickActionCard
                        title="File d'Attente"
                        description="Vue globale en temps réel"
                        icon={List}
                        href="/queue"
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />
                    <QuickActionCard
                        title="Rapports"
                        description="Statistiques détaillées"
                        icon={BarChart3}
                        href="/queue"
                        iconColor="text-purple-600"
                        iconBgColor="bg-purple-100"
                    />
                    <QuickActionCard
                        title="Pesée"
                        description="Interface de pesée"
                        icon={Activity}
                        href="/weighing"
                        iconColor="text-orange-600"
                        iconBgColor="bg-orange-100"
                    />
                </div>
            </div>

            {/* Department Overview */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Vue par Département</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {departmentStats.map((dept) => (
                        <Card key={dept.name} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                                <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total</span>
                                    <span className="text-2xl font-bold text-gray-900">{dept.tickets}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">En attente</span>
                                    <span className="text-lg font-semibold text-orange-600">{dept.pending}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Complétés</span>
                                    <span className="text-lg font-semibold text-green-600">{dept.tickets - dept.pending}</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Queue Visualization */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <List className="h-5 w-5 text-blue-600" />
                    Visualisation Temps Réel des Files
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {queues.map((queue) => (
                        <Card key={queue.queueId} className="p-4 bg-gray-50/50">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <Truck className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{queue.name}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                        {queue.truckCount} camions
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                                {queue.tickets.length > 0 ? (
                                    queue.tickets.map((ticket) => (
                                        <div
                                            key={ticket.ticketId}
                                            className={`p-3 rounded-xl border-2 transition-all hover:scale-[1.02] ${priorityColors[ticket.priority] || 'bg-white border-gray-100 shadow-sm'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-black text-lg">#{ticket.ticketNumber}</span>
                                                <div className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/50 border border-current">
                                                    Pos: {ticket.position}
                                                </div>
                                            </div>

                                            <div className="space-y-1 mt-2">
                                                <div className="flex items-center gap-1.5 text-xs opacity-90">
                                                    <Truck className="h-3 w-3" />
                                                    <span>{ticket.vehicleInfo?.licensePlate || 'Sans Immatriculation'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs opacity-90">
                                                    <Activity className="h-3 w-3" />
                                                    <span>Est: {ticket.estimatedWaitTime} min</span>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-2 border-t border-current/10 flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{ticket.status}</span>
                                                <div className={`w-2 h-2 rounded-full animate-pulse bg-current`} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-8 text-center text-gray-400 italic text-sm">
                                        Aucun camion dans cette file
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}

                    {queues.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-500">Aucune file d'attente configurée pour ce site.</p>
                        </div>
                    )}
                </div>
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

function DashboardSkeleton() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            <div className="h-10 w-64 bg-gray-200 rounded mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-32 bg-gray-100 rounded-xl" />
                ))}
            </div>
            <div className="space-y-4 pt-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-48 bg-gray-100 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}
