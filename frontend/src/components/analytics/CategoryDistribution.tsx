import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Card } from '../molecules/ui/card';
import { BarChart3, PieChart as PieIcon, Loader2 } from 'lucide-react';
import { useManagerContext } from '../../pages/Manager';
import { useManagerDistribution, useManagerSiteComparison } from '../../hooks/useDashboardStats';

export const CategoryDistribution: React.FC = () => {
  const { activeSiteId } = useManagerContext();
  
  const { data: distributionData, isLoading: distLoading, isFetching: distFetching } = useManagerDistribution(activeSiteId || '');
  const { data: comparisonData, isLoading: compLoading, isFetching: compFetching } = useManagerSiteComparison();
  
  const distribution = distributionData?.distribution || [];
  const totalTickets = distribution.reduce((acc, item) => acc + item.value, 0);

  if (distLoading || compLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/20">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bar Chart - Site Comparison */}
      <Card className="lg:col-span-2 bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border-white/20 shadow-sm border-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className={`transition-opacity ${compFetching ? 'animate-pulse opacity-50' : ''}`}>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Comparatif par Site</h3>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                Tickets par pôle métier et par site
              </p>
            </div>
          </div>
        </div>

        <div className="w-full relative min-h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
              <Bar dataKey="ELECT" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={20} />
              <Bar dataKey="Autre" fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={20} />
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
          <div className={`transition-opacity ${distFetching ? 'animate-pulse opacity-50' : ''}`}>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Répartition</h3>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              {activeSiteId ? `Site ${activeSiteId.slice(0,8)}` : 'Mix métier consolidé'}
            </p>
          </div>
        </div>

        <div className="w-full relative min-h-[250px]">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={distribution}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
              >
                {distribution.map((entry, index) => (
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
            <span className="text-3xl font-black text-slate-800 tracking-tighter">{totalTickets}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tickets</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {distribution.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{item.name}</span>
              </div>
              <span className="text-sm font-black text-slate-800">
                {totalTickets > 0 ? Math.round((item.value / totalTickets) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CategoryDistribution;
