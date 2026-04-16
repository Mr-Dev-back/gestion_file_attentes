import React from 'react';
import { Database, Zap, Mic, Server, Globe } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface StatusIndicatorProps {
  label: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  icon: React.ElementType;
}

const StatusIndicator = ({ label, status, icon: Icon }: StatusIndicatorProps) => {
  const statusColors = {
    healthy: 'text-success bg-success/10 border-success/20 shadow-[0_0_15px_rgba(0,143,57,0.1)]',
    unhealthy: 'text-danger bg-danger/10 border-danger/20 shadow-[0_0_15px_rgba(227,6,19,0.1)]',
    degraded: 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
  };

  const ledColors = {
    healthy: 'bg-success shadow-[0_0_8px_rgba(0,143,57,0.6)]',
    unhealthy: 'bg-danger shadow-[0_0_8px_rgba(227,6,19,0.6)]',
    degraded: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
  };

  return (
    <div className={cn(
      "flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-300 hover:scale-105",
      statusColors[status]
    )}>
      <div className="relative flex items-center justify-center">
        <Icon className="w-4 h-4" />
        <div className={cn(
          "absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white dark:border-slate-900",
          ledColors[status]
        )} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
    </div>
  );
};

interface VitalsHeaderProps {
  vitals: {
    api: 'healthy' | 'unhealthy' | 'degraded';
    database: 'healthy' | 'unhealthy' | 'degraded';
    realtime: 'healthy' | 'unhealthy' | 'degraded';
    vocal: 'healthy' | 'unhealthy' | 'degraded';
  };
  sites: any[];
  selectedSite: string;
  onSiteChange: (siteId: string) => void;
}

export const VitalsHeader = ({ vitals, sites, selectedSite, onSiteChange }: VitalsHeaderProps) => {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="pr-4 border-r border-slate-100 hidden xl:block">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Cockpit</h2>
            <p className="text-xl font-bold text-slate-800 tracking-tighter uppercase italic leading-none">Vitals</p>
        </div>
        <StatusIndicator label="API Core" status={vitals.api} icon={Server} />
        <StatusIndicator label="PostgreSQL" status={vitals.database} icon={Database} />
        <StatusIndicator label="Real-time" status={vitals.realtime} icon={Zap} />
        <StatusIndicator label="Vocal" status={vitals.vocal} icon={Mic} />
      </div>

      <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner group">
        <div className="pl-3 text-primary group-hover:scale-110 transition-transform">
          <Globe className="w-4 h-4" />
        </div>
        <select
          value={selectedSite}
          onChange={(e) => onSiteChange(e.target.value)}
          className="bg-transparent border-none text-xs font-bold uppercase tracking-widest focus:ring-0 cursor-pointer pr-10 py-2 outline-none text-slate-600"
        >
          <option value="">Vue Globale SIBM</option>
          {sites?.map((site) => (
            <option key={site.siteId} value={site.siteId}>
              {site.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
