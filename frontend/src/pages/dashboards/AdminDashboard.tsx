import { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAdminOverview, useSites } from '../../hooks/useDashboardStats';
import { VitalsHeader } from '../../components/organisms/dashboard/admin-overview/VitalsHeader';
import { TechnicalKPIs } from '../../components/organisms/dashboard/admin-overview/TechnicalKPIs';
import { InfrastructureHealth } from '../../components/organisms/dashboard/admin-overview/InfrastructureHealth';
import { PerformanceCharts } from '../../components/organisms/dashboard/admin-overview/PerformanceCharts';
import { LiveAuditStream } from '../../components/organisms/dashboard/admin-overview/LiveAuditStream';
import { MaintenanceConsole } from '../../components/organisms/dashboard/admin-overview/MaintenanceConsole';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FooterProps {
  cluster?: string;
  version?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_VITALS = {
  api: 'unhealthy',
  database: 'unhealthy',
  realtime: 'unhealthy',
  vocal: 'unhealthy',
} as const;

const DEFAULT_KPIS = {
  activeSessions: 0,
  activeTickets: 0,
  apiErrorRate: 0,
  criticalAlerts: 0,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-[80vh] gap-5 bg-slate-50">
    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
      Initialisation du cockpit SIGFA...
    </p>
  </div>
);

const FetchingIndicator = () => (
  <div className="absolute top-4 right-4 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
    <RefreshCw className="w-3 h-3 text-primary animate-spin" />
  </div>
);

const DashboardFooter = ({ cluster = 'Abidjan Main', version = '3.2.0-stable' }: FooterProps) => (
  <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest pt-6 border-t border-slate-100">
    <span>SIGFA © 2026 — Système Industriel de Gestion de File d'Attente</span>
    <div className="flex items-center gap-5">
      <span className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(0,143,57,0.7)]" />
        Cluster: {cluster}
      </span>
      <span className="px-2.5 py-1 bg-slate-100 rounded-lg">v{version}</span>
    </div>
  </div>
);

const CustomScrollbarStyle = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `}</style>
);

// ─── AdminDashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [selectedSite, setSelectedSite] = useState('');

  const {
    data: overview,
    isLoading: overviewLoading,
    isFetching: overviewFetching,
  } = useAdminOverview(selectedSite);

  const { data: sites } = useSites();

  if (overviewLoading && !overview) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* 1. Vitals Header */}
      <div className="relative">
        <VitalsHeader
          vitals={overview?.vitals ?? DEFAULT_VITALS}
          sites={sites ?? []}
          selectedSite={selectedSite}
          onSiteChange={setSelectedSite}
        />
        {overviewFetching && <FetchingIndicator />}
      </div>

      {/* 2. Main Content — 60/40 */}
      <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">

        {/* Left (60%) */}
        <div className="xl:col-span-6 space-y-6">
          <TechnicalKPIs kpis={overview?.kpis ?? DEFAULT_KPIS} />
          <InfrastructureHealth hardware={overview?.hardware ?? []} />
          <div className="h-[400px]">
            <PerformanceCharts
              trendData={overview?.charts?.ticketTrend ?? []}
              categoryData={overview?.charts?.categoryDistribution ?? []}
            />
          </div>
        </div>

        {/* Right (40%) */}
        <div className="xl:col-span-4 h-full">
          <LiveAuditStream logs={overview?.auditStream ?? []} />
        </div>
      </div>

      {/* 3. Maintenance */}
      <MaintenanceConsole />

      {/* 4. Footer */}
      <DashboardFooter />

      <CustomScrollbarStyle />
    </div>
  );
}
