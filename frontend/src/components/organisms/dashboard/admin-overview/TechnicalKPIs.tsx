import React from 'react';
import { Users, Truck, Activity, Bell } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  variant: 'blue' | 'green' | 'amber' | 'red';
}

const KPICard = ({ title, value, subtext, icon: Icon, variant }: KPICardProps) => {
  const variants = {
    blue: 'border-blue-100 bg-white text-blue-700 shadow-sm shadow-blue-500/5',
    green: 'border-emerald-100 bg-white text-emerald-700 shadow-sm shadow-emerald-500/5',
    amber: 'border-amber-100 bg-white text-amber-700 shadow-sm shadow-amber-500/5',
    red: 'border-rose-100 bg-white text-rose-700 shadow-sm shadow-rose-500/5',
  };

  const iconVariants = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className={cn(
      "p-5 rounded-3xl border transition-all duration-200 hover:shadow-md hover:border-transparent group",
      variants[variant]
    )}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
          <h3 className="text-2xl font-black text-slate-800 italic">{value}</h3>
          {subtext && <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 opacity-70">{subtext}</p>}
        </div>
        <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", iconVariants[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};


interface TechnicalKPIsProps {
  kpis: {
    activeSessions: number;
    activeTickets: number;
    apiErrorRate: number;
    criticalAlerts: number;
  };
}

export const TechnicalKPIs = ({ kpis }: TechnicalKPIsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <KPICard
        title="Sessions Actives"
        value={kpis.activeSessions}
        subtext="Utilisateurs connectés"
        icon={Users}
        variant="blue"
      />
      <KPICard
        title="Tickets en Flux"
        value={kpis.activeTickets}
        subtext="Workflows actifs"
        icon={Truck}
        variant="green"
      />
      <KPICard
        title="Taux d'Erreur API"
        value={`${kpis.apiErrorRate.toFixed(2)}%`}
        subtext="Dernière heure"
        icon={Activity}
        variant="amber"
      />
      <KPICard
        title="Alertes Critiques"
        value={kpis.criticalAlerts}
        subtext="Actions requises"
        icon={Bell}
        variant="red"
      />
    </div>
  );
};
