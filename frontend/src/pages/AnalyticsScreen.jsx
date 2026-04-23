import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import StatCard from '../components/analytics/StatCard';
import TicketLogTable from '../components/analytics/TicketLogTable';
import { Loader2, Download } from 'lucide-react';

export default function AnalyticsScreen() {
  const [siteId, setSiteId] = useState('global');
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [s, l] = await Promise.all([
        analyticsService.getDashboardStats(siteId),
        analyticsService.getTicketLogs(siteId)
      ]);
      
      console.log('STATS_DATA:', s);
      console.log('LOGS_DATA:', l);
      
      setStats(s);
      setLogs(l);
    } catch (error) {
      console.error("Analytics fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [siteId]);

  if (loading && !stats) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-indigo-500" /></div>;

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Analytics Opérationnels</h1>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          <Download size={18} /> Exporter Excel
        </button>
      </div>

      {stats && stats.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Temps d'Attente" avg={stats.summary.waitingTime.avg} min={stats.summary.waitingTime.min} max={stats.summary.waitingTime.max} unit="min" color="text-orange-600" />
          <StatCard title="Temps Traitement" avg={stats.summary.processingTime.avg} min={stats.summary.processingTime.min} max={stats.summary.processingTime.max} unit="min" color="text-blue-600" />
          <StatCard title="Temps Total" avg={stats.summary.totalTime.avg} min={stats.summary.totalTime.min} max={stats.summary.totalTime.max} unit="min" color="text-indigo-600" />
        </div>
      )}

      <TicketLogTable logs={logs} />
    </div>
  );
}
