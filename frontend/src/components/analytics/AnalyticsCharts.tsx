import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../molecules/ui/card';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

interface AnalyticsChartsProps {
  hourlyData: { time: string; count: number }[];
  categoryData: { name: string; value: number }[];
}

const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsCharts({ hourlyData, categoryData }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Volume Horaire */}
      <Card className="border-border/30 bg-white/50 backdrop-blur-sm shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50 bg-slate-50/50">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Affluence par Heure
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '1rem', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCount)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Répartition par Catégorie */}
      <Card className="border-border/30 bg-white/50 backdrop-blur-sm shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50 bg-slate-50/50">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-emerald-500" /> Mix Catégories
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1500}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center"
                iconType="circle"
                formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
