import { useState, useEffect, useMemo } from 'react';
import { analyticsApi } from '../services/analyticsApi';
import { 
    Loader2, 
    Download, 
    Calendar, 
    TrendingUp, 
    Clock, 
    Truck, 
    CheckCircle2, 
    Filter,
    BarChart3,
    PieChart as PieChartIcon,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    PieChart, 
    Pie, 
    Cell,
    Legend
} from 'recharts';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '../components/molecules/ui/card';
import { Badge } from '../components/atoms/ui/badge';
import { cn } from '../lib/utils';

const COLORS = ['#008F39', '#FFB800', '#FF3B30', '#007AFF', '#5856D6', '#AF52DE'];

export default function AnalyticsDashboard() {
    const [siteId, setSiteId] = useState('global');
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });
    const [stats, setStats] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [s, t] = await Promise.all([
                analyticsApi.getDashboardStats(siteId, dateRange.start, dateRange.end),
                analyticsApi.getTicketsList(dateRange.start, dateRange.end, siteId)
            ]);
            setStats(s);
            setTickets(t.tickets || []);
        } catch (error) {
            console.error("Analytics fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [siteId, dateRange]);

    const handleExport = async () => {
        try {
            await analyticsApi.exportCSV(siteId, dateRange.start, dateRange.end);
        } catch (error) {
            console.error("Export error:", error);
        }
    };

    if (loading && !stats) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        ANALYTICS OPÉRATIONNELS
                    </h1>
                    <p className="text-slate-500 font-medium">Suivi des performances et flux logistiques en temps réel.</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <input 
                            type="date" 
                            className="text-xs font-bold border-none focus:ring-0 p-0" 
                            value={dateRange.start}
                            onChange={e => setDateRange({...dateRange, start: e.target.value})}
                        />
                        <span className="text-slate-300">-</span>
                        <input 
                            type="date" 
                            className="text-xs font-bold border-none focus:ring-0 p-0" 
                            value={dateRange.end}
                            onChange={e => setDateRange({...dateRange, end: e.target.value})}
                        />
                    </div>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition-all text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-slate-200"
                    >
                        <Download size={14} /> Exporter
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title="Volume Total" 
                    value={stats?.summary?.ticketsTotal || 0} 
                    unit="Tickets"
                    icon={<Truck className="h-6 w-6" />}
                    trend="+12%"
                    positive={true}
                />
                <KpiCard 
                    title="Temps d'Attente Moyen" 
                    value={stats?.summary?.waitingTime?.avg || 0} 
                    unit="min"
                    icon={<Clock className="h-6 w-6" />}
                    trend="-5 min"
                    positive={true}
                />
                <KpiCard 
                    title="Taux d'Occupation" 
                    value={stats?.summary?.quaiOccupationRate || 0} 
                    unit="%"
                    icon={<BarChart3 className="h-6 w-6" />}
                    trend="+2.4%"
                    positive={true}
                />
                <KpiCard 
                    title="Rotation Complète" 
                    value={stats?.summary?.totalTime?.avg || 0} 
                    unit="min"
                    icon={<CheckCircle2 className="h-6 w-6" />}
                    trend="+8 min"
                    positive={false}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Volume Horaire */}
                <Card className="lg:col-span-8 border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-slate-50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Volume de Trafic (24h)</CardTitle>
                            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Temps Réel</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.charts?.hourlyVolume || []}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#008F39" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#008F39" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#008F39" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Répartition Catégories */}
                <Card className="lg:col-span-4 border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-slate-50">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Flux par Activité</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.charts?.categories || []}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats?.charts?.categories?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Last Tickets Table */}
            <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Journal des Rotations</CardTitle>
                    <div className="relative w-64">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            placeholder="Rechercher..." 
                            className="pl-10 pr-4 py-2 w-full bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Véhicule</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Catégorie</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Site</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Heures</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Délai Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {tickets.slice(0, 10).map((ticket, i) => (
                                    <tr key={i} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-700 uppercase">{ticket.licensePlate}</span>
                                                <span className="text-[10px] font-bold text-slate-400 font-mono">#{ticket.ticketNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-white border-slate-200">
                                                {ticket.category?.name || 'Standard'}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-600 italic">
                                            {ticket.site?.name}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400">ENTRÉE</span>
                                                    <span className="text-xs font-bold text-slate-700">{format(new Date(ticket.arrivedAt), 'HH:mm')}</span>
                                                </div>
                                                <div className="w-4 h-px bg-slate-200" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400">SORTIE</span>
                                                    <span className="text-xs font-bold text-slate-700">{ticket.completedAt ? format(new Date(ticket.completedAt), 'HH:mm') : '--:--'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {(() => {
                                                const diff = ticket.completedAt 
                                                    ? Math.round((new Date(ticket.completedAt).getTime() - new Date(ticket.arrivedAt).getTime()) / 60000)
                                                    : 0;
                                                return (
                                                    <div className={cn(
                                                        "px-3 py-1 rounded-full text-xs font-black w-fit",
                                                        diff > 60 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                                    )}>
                                                        {diff} min
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function KpiCard({ title, value, unit, icon, trend, positive }: any) {
    return (
        <Card className="border-none shadow-lg bg-white rounded-[2rem] overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-8">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl text-slate-800">
                        {icon}
                    </div>
                    <div className={cn(
                        "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
                        positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                        {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {trend}
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800 tracking-tighter">{value}</span>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{unit}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
