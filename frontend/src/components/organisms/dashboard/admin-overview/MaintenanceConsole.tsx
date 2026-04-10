import React from 'react';
import { RefreshCw, Users, ShieldAlert, Download } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MaintenanceAction {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIONS: MaintenanceAction[] = [
  { label: 'Restart Workers',     icon: RefreshCw, variant: 'default' },
  { label: 'Clear Sessions',      icon: Users,     variant: 'default' },
  { label: 'System Logs (.log)',  icon: Download,  variant: 'primary' },
];

const BUTTON_VARIANTS: Record<NonNullable<MaintenanceAction['variant']>, string> = {
  default: 'bg-surface/50 border-border/50 text-text-muted hover:bg-white/60 hover:shadow-md hover:text-text-main',
  primary: 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:shadow-md hover:shadow-primary/10',
  danger:  'bg-danger/10 border-danger/20 text-danger hover:bg-danger/20 hover:shadow-md hover:shadow-danger/10',
};

// ─── ActionButton ─────────────────────────────────────────────────────────────

const ActionButton = ({ label, icon: Icon, onClick, variant = 'default' }: MaintenanceAction) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-sm transition-all ${BUTTON_VARIANTS[variant]}`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);

// ─── MaintenanceConsole ───────────────────────────────────────────────────────

export const MaintenanceConsole = () => (
  <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-lg">
    {/* Subtle gradient accent */}
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warning/60 to-warning/10 opacity-60 rounded-t-3xl" />

    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      {/* Identity */}
      <div className="flex items-center gap-4">
        <div className="p-2 bg-warning/10 rounded-xl text-warning shadow-inner">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Système</p>
          <h3 className="text-lg font-black text-text-main tracking-tight leading-none mt-0.5">
            Console de Maintenance
          </h3>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1.5">
            Interventions de secours & diagnostic
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        {ACTIONS.map((action) => (
          <ActionButton key={action.label} {...action} />
        ))}
      </div>
    </div>
  </div>
);