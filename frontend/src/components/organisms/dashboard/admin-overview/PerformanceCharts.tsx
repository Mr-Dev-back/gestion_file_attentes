import { useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TicketTrendData {
  time: string;
  count: number;
}

export interface CategoryDistData {
  [key: string]: string | number;
  name: string;
  value: number;
  color: string;
}

interface PerformanceChartsProps {
  trendData: TicketTrendData[];
  categoryData: CategoryDistData[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AXIS_TICK = { fontSize: 10, fontWeight: 900, fill: 'var(--color-text-muted, #64748b)' } as const;

const TOOLTIP_STYLE: React.CSSProperties = {
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
  fontSize: '11px',
  fontWeight: '900',
  backgroundColor: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(8px)',
  textTransform: 'uppercase',
};

import { Card, CardHeader as UiCardHeader, CardTitle, CardContent } from '../../../molecules/ui/card';

// ─── Sub-components ───────────────────────────────────────────────────────────

const CustomCardHeader = ({ icon: Icon, label, title, badge }: {
  icon: React.ElementType;
  label: string;
  title: string;
  badge?: React.ReactNode;
}) => (
  <UiCardHeader className="flex flex-row items-center justify-between pb-2 p-6 border-b border-border/10 bg-white/30">
    <div className="flex flex-col gap-1">
      <CardTitle className="text-xl font-black flex items-center gap-3">
        <Icon className="w-5 h-5 text-primary" />
        {title}
      </CardTitle>
      <p className="text-xs text-text-muted font-bold uppercase tracking-widest ml-8">{label}</p>
    </div>
    {badge}
  </UiCardHeader>
);

const SkeletonCard = ({ className }: { className?: string }) => (
  <Card className={`border-slate-200/60 shadow-lg bg-white rounded-2xl animate-pulse ${className ?? ''}`}>
    <div className="h-64" />
  </Card>
);

const CategoryLegendItem = ({ name, value, color }: CategoryDistData) => (
  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100 hover:shadow-sm group cursor-pointer">
    <div className="flex items-center gap-3">
      <div className="w-2.5 h-2.5 rounded-full shadow-sm group-hover:scale-125 transition-transform" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate max-w-[120px]">{name}</span>
    </div>
    <span className="text-[10px] font-black text-slate-800 bg-white px-2.5 py-1 rounded-xl shadow-sm border border-slate-200">
      {value}
    </span>
  </div>
);

// ─── Chart Panels ─────────────────────────────────────────────────────────────

const TrendChart = ({ data }: { data: TicketTrendData[] }) => (
  <Card className="lg:col-span-2 border-slate-200/60 shadow-lg bg-white rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
    <CustomCardHeader
      icon={TrendingUp}
      label="Performance"
      title="Évolution des Tickets"
      badge={
        <div className="flex items-center gap-2 text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 uppercase tracking-widest shadow-sm">
          <Activity className="w-3 h-3 animate-pulse" />
          FLUX TEMPS RÉEL
        </div>
      }
    />
    <CardContent className="p-6 flex-1 min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary, #10b981)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--color-primary, #10b981)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #e2e8f0)" strokeOpacity={0.5} />
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'var(--color-primary, #10b981)', strokeWidth: 1, strokeOpacity: 0.3 }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--color-primary, #10b981)"
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#colorCount)"
            activeDot={{ r: 8, strokeWidth: 0, fill: 'var(--color-primary, #10b981)' }}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

const DistributionChart = ({ data }: { data: CategoryDistData[] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border-slate-200/60 shadow-lg bg-white rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
      <CustomCardHeader icon={PieChartIcon} label="Analyses" title="Distribution" />

      <CardContent className="p-6 pt-2 flex flex-col flex-1">
        <div className="relative w-full flex-1 flex items-center justify-center min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="85%"
                paddingAngle={8}
                dataKey="value"
                animationBegin={0}
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ ...TOOLTIP_STYLE, fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <span className="text-4xl font-black text-slate-800 tracking-tighter italic">{total}</span>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-[-4px]">Tickets</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
          {data.slice(0, 4).map((item, idx) => (
            <CategoryLegendItem key={idx} {...item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── PerformanceCharts ────────────────────────────────────────────────────────

export const PerformanceCharts = ({ trendData, categoryData }: PerformanceChartsProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[400px]">
        <SkeletonCard className="lg:col-span-2" />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <TrendChart data={trendData} />
      <DistributionChart data={categoryData} />
    </div>
  );
};
