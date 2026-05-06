import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Calendar, Download, RefreshCcw } from 'lucide-react';
import { analyticsApi } from '../../services/analyticsApi';
import { useSites, type Site } from '../../hooks/useSites';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/molecules/ui/card';
import { Button } from '../../components/atoms/ui/button';
import { Input } from '../../components/atoms/ui/input';
import AnalyticsCharts from '../../components/analytics/AnalyticsCharts';
import { cn } from '../../lib/utils';

type DashboardStatsResponse = {
  summary?: {
    waitingTime?: { avg?: string | number };
    processingTime?: { avg?: string | number };
    totalTime?: { avg?: string | number };
    ticketsTotal?: number;
  };
  charts?: {
    hourlyVolume?: any[];
    categories?: any[];
  };
};

const StatLine = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2">
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
    <div className="text-sm font-black text-slate-800">{value}</div>
  </div>
);

export default function ManagerTiming() {
  const { sites, isLoading: sitesLoading } = useSites();
  const [siteId, setSiteId] = useState<string>('');
  const siteList = (sites || []) as Site[];
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
    return { start, end };
  });

  const effectiveSiteId = useMemo(() => {
    if (siteId) return siteId;
    return siteList?.[0]?.siteId || 'global';
  }, [siteId, siteList]);

  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getDashboardStats(effectiveSiteId, dateRange.start, dateRange.end);
      setData(res as DashboardStatsResponse);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!effectiveSiteId) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSiteId, dateRange.start, dateRange.end]);

  const handleExport = async () => {
    await analyticsApi.exportCSV(effectiveSiteId, dateRange.start, dateRange.end);
  };

  const summary = data?.summary || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            Temps de cadencement
          </h2>
          <p className="text-slate-500 font-medium">Synthèse des temps (attente, traitement, total) sur la période.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 px-3 py-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
              className="h-8 w-[150px] rounded-xl border-none font-bold"
            />
            <span className="text-slate-300 font-black">-</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
              className="h-8 w-[150px] rounded-xl border-none font-bold"
            />
          </div>

          <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 px-3 py-2">
            <select
              value={effectiveSiteId === 'global' ? '' : effectiveSiteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="text-sm font-bold bg-transparent outline-none"
              disabled={sitesLoading}
            >
              {siteList.map((s: Site) => (
                <option key={s.siteId} value={s.siteId}>{s.name}</option>
              ))}
            </select>
          </div>

          <Button variant="outline" className="rounded-2xl" onClick={fetchData} disabled={loading}>
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
          <Button className="rounded-2xl font-black" onClick={handleExport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-border/30 overflow-hidden">
          <CardHeader className="bg-slate-50/60 border-b border-border/10">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Synthèse</CardTitle>
          </CardHeader>
          <CardContent className="p-5 divide-y divide-border/10">
            <StatLine label="Tickets (période)" value={`${summary.ticketsTotal ?? 0}`} />
            <StatLine label="Attente moyenne" value={`${summary.waitingTime?.avg ?? 0} min`} />
            <StatLine label="Traitement moyen" value={`${summary.processingTime?.avg ?? 0} min`} />
            <StatLine label="Temps total moyen" value={`${summary.totalTime?.avg ?? 0} min`} />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/30 overflow-hidden lg:col-span-2">
          <CardHeader className="bg-slate-50/60 border-b border-border/10">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Visualisations</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {(charts.hourlyVolume?.length || 0) > 0 || (charts.categories?.length || 0) > 0 ? (
              <AnalyticsCharts
                hourlyData={charts.hourlyVolume || []}
                categoryData={charts.categories || []}
              />
            ) : (
              <div className="text-slate-500 font-bold">Aucune donnée graphique sur la période.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
