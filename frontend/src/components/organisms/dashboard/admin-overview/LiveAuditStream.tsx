import { History, Clock, User, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: string;
  color: string;
}

interface LiveAuditStreamProps {
  logs: AuditLog[];
  onViewAll?: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const AuditItem = ({ user, action, details, timestamp, color }: AuditLog) => {
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative pl-6 pb-5 last:pb-0 group">
      <div className="absolute left-0 top-2 bottom-0 w-px bg-gradient-to-b from-border to-transparent" />
      <div
        className="absolute left-[-4px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-background transition-transform group-hover:scale-125 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <div className="bg-surface/50 border border-border/50 rounded-2xl p-3.5 transition-all hover:bg-white/60 hover:shadow-md hover:translate-x-0.5 backdrop-blur-sm cursor-default">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-text-muted" />
            <span className="text-[11px] font-black text-text-main uppercase tracking-tight">{user}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
            <Clock className="w-3 h-3" />
            {time}
          </div>
        </div>
        <span
          className="inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg mb-2 tracking-widest"
          style={{ color, backgroundColor: `${color}18` }}
        >
          {action}
        </span>
        <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed italic">"{details}"</p>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-40 gap-3">
    <div className="p-4 bg-surface/50 rounded-2xl border border-border/50">
      <History className="w-6 h-6 text-text-muted opacity-40" />
    </div>
    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Aucune activité récente</p>
  </div>
);

// ─── LiveAuditStream ──────────────────────────────────────────────────────────

export const LiveAuditStream = ({ logs, onViewAll }: LiveAuditStreamProps) => (
  <div className="bg-white/60 backdrop-blur-xl border border-border/50 rounded-3xl shadow-lg flex flex-col h-full overflow-hidden">
    {/* Header */}
    <div className="px-6 pt-6 pb-5 border-b border-border/40 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-inner">
          <History className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Activité</p>
          <h3 className="text-lg font-black text-text-main tracking-tight leading-none mt-0.5">Audit Stream</h3>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 uppercase tracking-widest shadow-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        LIVE
      </div>
    </div>

    {/* Logs */}
    <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
      {logs.length > 0
        ? <div>{logs.slice(0, 10).map((log) => <AuditItem key={log.id} {...log} />)}</div>
        : <EmptyState />
      }
    </div>

    {/* Footer */}
    <div className="px-6 pb-6 pt-3 border-t border-border/40">
      <button
        onClick={onViewAll}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-surface/50 border border-border/50 text-[10px] font-black text-text-muted uppercase tracking-widest hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all group"
      >
        Voir tout l'historique
        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  </div>
);
