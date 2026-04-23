import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Card } from '../molecules/ui/card';
import { BarChart3, PieChart as PieIcon, Layers, Loader2 } from 'lucide-react';
import { useManagerContext } from '../../pages/Manager';
import { useManagerStats } from '../../hooks/useDashboardStats';

const CATEGORY_DATA = [
  { site: 'Abidjan', INFRA: 45, BATIMENT: 32, ELECTRICITE: 18 },
  { site: 'San Pedro', INFRA: 28, BATIMENT: 45, ELECTRICITE: 12 },
  { site: 'Bouaké', INFRA: 15, BATIMENT: 10, ELECTRICITE: 25 },
];

const GLOBAL_DISTRIBUTION = [
  { name: 'INFRA', value: 88, color: '#3b82f6' },
  { name: 'BATIMENT', value: 87, color: '#f97316' },
  { name: 'ELECTRICITE', value: 55, color: '#a855f7' },
];

export const CategoryDistribution: React.FC = () => {
  const { activeSiteId } = useManagerContext();
  const { isFetching } = useManagerStats(); // To get the global refetch state
  
  // Filter data based on activeSiteId
  // If no site is selected, show global comparison. If a site is selected, we might focus on it.
  const filteredData = useMemo(() => {
    if (!activeSiteId) return CATEGORY_DATA;
    // For demonstration, we just highlight or filter the list
    // In a real app, this would be an API call with siteId
    return CATEGORY_DATA.filter(d => d.site.toUpperCase() === 'ABIDJAN'); // Simplified logic
  }, [activeSiteId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bar Chart - Site Comparison */}
      <Card className="lg:col-span-2 bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border-white/20 shadow-sm border-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className={`transition-opacity ${isFetching ? 'animate-pulse opacity-50' : ''}`}>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Comparatif par Site</h3>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                {activeSiteId ? `Focus : ${activeSiteId.slice(0, 8)}` : 'Tickets par pôle métier'}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full relative">
          <ResponsiveContainer width="100%" aspect={2}>
            <BarChart data={CATEGORY_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="site" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  color: '#fff'
                }}
                itemStyle={{ fontWeight: 800, fontSize: '12px' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
              <Bar dataKey="INFRA" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={20} />
              <Bar dataKey="BATIMENT" fill="#f97316" radius={[6, 6, 0, 0]} barSize={20} />
              <Bar dataKey="ELECTRICITE" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Pie Chart - Global Distribution */}
      <Card className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border-white/20 shadow-sm border-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-600">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Répartition Globale</h3>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mix métier consolidé</p>
          </div>
        </div>

        <div className="w-full relative">
          <ResponsiveContainer width="100%" aspect={1}>
            <PieChart>
              <Pie
                data={GLOBAL_DISTRIBUTION}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
              >
                {GLOBAL_DISTRIBUTION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  borderRadius: '16px', 
                  border: 'none',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-slate-800 tracking-tighter">230</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tickets</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {GLOBAL_DISTRIBUTION.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{item.name}</span>
              </div>
              <span className="text-sm font-black text-slate-800">{Math.round((item.value / 230) * 100)}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CategoryDistribution;
