import { Smartphone, Monitor as MonitorIcon, Zap, Activity } from 'lucide-react';
import { cn } from '../../../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
type DeviceType = 'ENTRANCE' | 'EXIT' | 'KIOSK' | 'DISPLAY' | 'LED' | string;

export interface HardwareDevice {
  kioskId: string;
  name: string;
  kioskType: DeviceType;
  status: DeviceStatus;
  ipAddress: string;
  site?: { name: string };
}

interface DeviceItemProps {
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ip: string;
  site?: string;
}

interface InfrastructureHealthProps {
  hardware: HardwareDevice[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KIOSK_TYPES = new Set(['ENTRANCE', 'EXIT', 'KIOSK']);
const DISPLAY_TYPES = new Set(['DISPLAY', 'LED']);

const STATUS_CONFIG: Record<DeviceStatus, { text: string; bg: string; led: string; label: string }> = {
  ONLINE:      { text: 'text-success',   bg: 'bg-success/10 border-success/20',      led: 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]',  label: 'Online' },
  OFFLINE:     { text: 'text-text-muted', bg: 'bg-surface/50 border-border/50',       led: 'bg-text-muted/40',                                  label: 'Offline' },
  MAINTENANCE: { text: 'text-warning',   bg: 'bg-warning/10 border-warning/20',      led: 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]',  label: 'Maint.' },
  ERROR:       { text: 'text-danger',    bg: 'bg-danger/10 border-danger/20',        led: 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.6)]',    label: 'Erreur' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDeviceIcon = (type: DeviceType) => {
  const t = type.toUpperCase();
  if (KIOSK_TYPES.has(t)) return Smartphone;
  if (DISPLAY_TYPES.has(t)) return MonitorIcon;
  return Activity;
};

// ─── DeviceItem ───────────────────────────────────────────────────────────────

const DeviceItem = ({ name, type, status, ip, site }: DeviceItemProps) => {
  const Icon = getDeviceIcon(type);
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface/50 border border-border/50 transition-all hover:bg-white/60 hover:shadow-md group cursor-default backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className={cn('p-2.5 rounded-xl border transition-transform group-hover:scale-110', cfg.bg, cfg.text)}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-black text-text-main uppercase tracking-tight">{name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{ip}</span>
            {site && (
              <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                {site}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={cn('hidden sm:block text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', cfg.bg, cfg.text)}>
          {cfg.label}
        </span>
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.led)} />
        <button className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-white/70 border border-border/50 shadow-sm text-text-muted hover:text-primary hover:border-primary/20 transition-all">
          <Zap className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// ─── InfrastructureHealth ─────────────────────────────────────────────────────

export const InfrastructureHealth = ({ hardware }: InfrastructureHealthProps) => (
  <div className="bg-white/60 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-lg flex flex-col">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-inner">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Infrastructure</p>
          <h3 className="text-lg font-black text-text-main tracking-tight leading-none mt-0.5">Hardware Health</h3>
        </div>
      </div>
      <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm uppercase tracking-widest">
        {hardware.length} Composants
      </span>
    </div>

    {/* Status summary */}
    {hardware.length > 0 && (
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'] as DeviceStatus[]).map((s) => {
          const count = hardware.filter((d) => d.status === s).length;
          if (!count) return null;
          const cfg = STATUS_CONFIG[s];
          return (
            <div key={s} className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest', cfg.bg, cfg.text)}>
              <div className={cn('w-1.5 h-1.5 rounded-full', cfg.led)} />
              {count} {cfg.label}
            </div>
          );
        })}
      </div>
    )}

    {/* Device grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar min-h-0">
      {hardware.map((device) => (
        <DeviceItem
          key={device.kioskId}
          name={device.name}
          type={device.kioskType}
          status={device.status}
          ip={device.ipAddress}
          site={device.site?.name}
        />
      ))}
    </div>
  </div>
);
