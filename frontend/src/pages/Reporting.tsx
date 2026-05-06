import { useEffect, useState, useMemo } from 'react';
import { analyticsApi } from '../services/analyticsApi';
import { useSites } from '../hooks/useSites';
import StatCards from '../components/analytics/StatCards';
import AnalyticsTicketTable from '../components/analytics/AnalyticsTicketTable';
import TicketDetailsModal from '../components/analytics/TicketDetailsModal';
import AnalyticsCharts from '../components/analytics/AnalyticsCharts';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { 
    Loader2, 
    AlertCircle, 
    Calendar, 
    Download, 
    Filter, 
    RefreshCcw, 
    FileSpreadsheet,
    FileCode,
    Building2,
    BarChart3,
    ClipboardList
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/molecules/ui/card';
import { Button } from '../components/atoms/ui/button';
import { Input } from '../components/atoms/ui/input';
import { cn } from '../lib/utils';

export default function Reporting() {
    const { user } = useAuthStore();
    const { sites } = useSites();
    
    const [stats, setStats] = useState<any>(null);
    const [reports, setReports] = useState<any>(null);
    const [ticketList, setTicketList] = useState<any[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [chartData, setChartData] = useState<{ hourlyVolume: any[]; categories: any[] }>({
        hourlyVolume: [],
        categories: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [selectedSite, setSelectedSite] = useState('global');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const isAdmin = user?.role === 'ADMINISTRATOR' || user?.role === 'MANAGER';

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const [statsRes, reportsData, listData] = await Promise.all([
                analyticsApi.getDashboardStats(selectedSite, dateRange.start, dateRange.end),
                analyticsApi.getReports(dateRange.start, dateRange.end, selectedSite),
                analyticsApi.getTicketsList(dateRange.start, dateRange.end, selectedSite)
            ]);
            
            setStats(statsRes.summary);
            setChartData(statsRes.charts || { hourlyVolume: [], categories: [] });
            setReports(reportsData);
            setTicketList(listData.tickets || []);
        } catch (err) {
            console.error("Error fetching analytics:", err);
            setError("Impossible de charger les statistiques.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) fetchData();
    }, [isAdmin, selectedSite, dateRange.start, dateRange.end]);


    const handleExport = async () => {
        try {
            setIsExporting(true);
            await analyticsApi.exportCSV(selectedSite, dateRange.start, dateRange.end);
        } catch (err) {
            console.error("Export error:", err);
        } finally {
            setIsExporting(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex h-[80vh] items-center justify-center p-6">
                <Card className="max-w-md w-full border-red-100 bg-red-50/50 shadow-none">
                    <CardContent className="flex flex-col items-center p-8 text-center">
                        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-black text-red-900 uppercase tracking-tight">Accès réservé</h2>
                        <p className="text-red-700 mt-2 font-medium">Cette section est réservée à la direction et aux administrateurs du système.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        ANALYTICS & REPORTING
                    </h2>
                    <p className="text-text-muted font-medium">Indicateurs de performance et statistiques d'exploitation</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchData} 
                        disabled={isLoading}
                        className="rounded-xl border-border/40"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    </Button>
                    
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => exportToExcel(ticketList)} 
                        disabled={ticketList.length === 0}
                        className="border-success/50 text-success hover:bg-success/10 rounded-xl px-4 font-bold"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        EXCEL
                    </Button>

                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => exportToPDF(ticketList)} 
                        disabled={ticketList.length === 0}
                        className="border-danger/50 text-danger hover:bg-danger/10 rounded-xl px-4 font-bold"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                    </Button>

                    <Button 
                        size="sm" 
                        onClick={handleExport} 
                        disabled={isExporting}
                        className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/20 px-4 font-bold"
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileCode className="h-4 w-4 mr-2" />}
                        CSV
                    </Button>
                </div>
            </div>

            {/* Global Filters */}
            <Card className="border-border/30 bg-surface/50 backdrop-blur-sm overflow-visible">
                <CardContent className="p-4 flex flex-wrap items-end gap-6">
                    <div className="space-y-1.5 min-w-[200px]">
                        <label className="text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center gap-2">
                            <Building2 className="h-3 w-3" /> Périmètre
                        </label>
                        <select 
                            value={selectedSite} 
                            onChange={(e) => setSelectedSite(e.target.value)}
                            className="w-full h-10 px-3 py-2 bg-background border border-border/40 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                        >
                            <option value="global">Tous les sites (Consolidé)</option>
                            {sites?.map((s: any) => (
                                <option key={s.siteId} value={s.siteId}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Du
                            </label>
                            <Input 
                                type="date" 
                                value={dateRange.start} 
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="rounded-xl border-border/40 font-bold h-10"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Au
                            </label>
                            <Input 
                                type="date" 
                                value={dateRange.end} 
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="rounded-xl border-border/40 font-bold h-10"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-center font-bold flex items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5" /> {error}
                </div>
            )}

            {stats && (
                <div className="space-y-10">
                    <StatCards summary={{
                        ticketsToday: stats.ticketsTotal ?? 0,
                        avgWaitingTime: stats.waitingTime?.avg ?? "0",
                        avgProcessingTime: stats.processingTime?.avg ?? "0",
                        avgTotalTime: stats.totalTime?.avg ?? "0",
                        trucksInQueue: stats.trucksInQueue ?? 0,
                        trucksInLoading: stats.trucksInLoading ?? 0,
                        quaiOccupationRate: stats.quaiOccupationRate ?? "0"
                    }} />

                    {/* Visualisations */}
                    {!isLoading && (chartData.hourlyVolume.length > 0 || chartData.categories.length > 0) && (
                        <AnalyticsCharts 
                            hourlyData={chartData.hourlyVolume} 
                            categoryData={chartData.categories} 
                        />
                    )}

                    {/* NEW: RECAP TABLE */}
                    <AnalyticsTicketTable 
                        tickets={ticketList} 
                        onViewDetails={(id) => setSelectedTicketId(id)}
                    />

                    <div className="grid md:grid-cols-2 gap-6 pb-20">
                        {/* Reports by Site */}
                        <Card className="border-border/30 rounded-[2rem] overflow-hidden shadow-xl">
                            <CardHeader className="border-b border-border/5 bg-slate-50/50">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Building2 className="h-4 w-4" /> Flux par Site
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/5">
                                    {reports?.statsBySite?.length > 0 ? (
                                        reports.statsBySite.map((item: any) => (
                                            <div key={item.siteId} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                <div>
                                                    <p className="font-bold text-slate-900">{item.site?.name}</p>
                                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-0.5">Temps moyen: {parseFloat(item.avgDuration).toFixed(1)} min</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-slate-800 tracking-tighter">{item.total}</p>
                                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">camions</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-text-muted italic text-sm bg-slate-50/20">
                                            Aucune donnée sur cette période.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Visual KPI Placeholder (Bar Chart like representation) */}
                        <Card className="border-border/30 bg-primary/[0.02] rounded-[2rem] overflow-hidden shadow-xl">
                            <CardHeader className="border-b border-border/5 bg-slate-50/50">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Download className="h-4 w-4" /> Activité Récente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-8">
                                        <span>Indicateur</span>
                                        <span>Valeur Relative</span>
                                    </div>
                                    {[
                                        { label: 'Occupation Quais', val: parseFloat(stats.quaiOccupationRate), max: 100, color: 'bg-secondary' },
                                        { label: 'Flux Total', val: stats.ticketsTotal, max: 100, color: 'bg-success' }
                                    ].map(kpi => (
                                        <div key={kpi.label} className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black uppercase tracking-tight text-slate-700">{kpi.label}</span>
                                                <span className="text-xs font-black text-primary">{kpi.val}{kpi.label.includes('Occupation') ? '%' : ''}</span>
                                            </div>
                                            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                                <div 
                                                    className={cn("h-full transition-all duration-1000 rounded-full shadow-lg", kpi.color)} 
                                                    style={{ width: `${Math.min((kpi.val / kpi.max) * 100, 100)}%` }} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Ticket Details Modal */}
            <TicketDetailsModal 
                isOpen={!!selectedTicketId} 
                onClose={() => setSelectedTicketId(null)}
                ticketId={selectedTicketId || ''}
            />
        </div>
    );
}

