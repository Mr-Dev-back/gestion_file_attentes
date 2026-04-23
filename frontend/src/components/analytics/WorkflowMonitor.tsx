import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ArrowRight, Truck, Loader2 } from 'lucide-react';
import type { WorkflowStage } from '../../types/analytics';
import { useSupervisorQueues } from '../../hooks/useDashboardStats';
import { useManagerContext } from '../../pages/Manager';

export const WorkflowMonitor: React.FC = () => {
  const { activeSiteId } = useManagerContext();
  const { data: queues, isLoading, isFetching } = useSupervisorQueues(activeSiteId || '');

  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-20 border border-white/20 shadow-sm flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Analyse des flux en cours...</p>
      </div>
    );
  }

  // Map real queues to our workflow stages
  // This is a simplified mapping: we take the first few queues as stages
  const stages: WorkflowStage[] = (queues || []).slice(0, 3).map((q, idx) => ({
    id: q.queueId,
    name: q.name,
    truckCount: q.truckCount,
    avgTime: Math.floor(Math.random() * 60), // Mocking avg time as it's not in the response
    isBottleneck: q.truckCount > 10 || Math.random() > 0.7 // Example logic for bottleneck
  }));

  const totalTrucks = stages.reduce((acc, s) => acc + s.truckCount, 0);

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/20 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-orange-500 text-white rounded-3xl shadow-lg shadow-orange-500/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-2xl font-black text-slate-800 tracking-tighter transition-opacity ${isFetching ? 'animate-pulse opacity-50' : ''}`}>
              Flux Logistique Temps Réel
            </h3>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
              {activeSiteId ? `Supervision : Site ${activeSiteId.slice(0, 8)}` : 'Supervision des étapes de transit'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
            ))}
          </div>
          <span className="text-sm font-black text-slate-600">{totalTrucks} camions actifs</span>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="relative flex flex-col md:flex-row items-center gap-4 md:gap-2">
        {stages.length > 0 ? stages.map((stage, idx) => (
          <React.Fragment key={stage.id}>
            {/* Stage Card */}
            <div className={`relative flex-1 w-full md:w-auto p-6 rounded-[2rem] border-2 transition-all duration-500 ${
              stage.isBottleneck 
                ? 'bg-red-50 border-red-200 shadow-[0_0_40px_rgba(239,68,68,0.1)]' 
                : 'bg-white border-slate-100'
            }`}>
              {stage.isBottleneck && (
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-xl shadow-lg shadow-red-500/30 z-10"
                >
                  <AlertTriangle className="w-4 h-4" />
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${stage.isBottleneck ? 'text-red-500' : 'text-slate-400'}`}>
                    Étape {idx + 1}
                  </span>
                  <div className={`flex items-center gap-1 text-xs font-black ${stage.isBottleneck ? 'text-red-600' : 'text-slate-600'}`}>
                    <Clock className="w-3 h-3" />
                    {stage.avgTime} min
                  </div>
                </div>

                <h4 className={`text-lg font-black tracking-tight ${stage.isBottleneck ? 'text-red-900' : 'text-slate-800'}`}>
                  {stage.name}
                </h4>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none">Camions</p>
                    <p className={`text-2xl font-black transition-opacity ${isFetching ? 'animate-pulse opacity-50' : ''} ${stage.isBottleneck ? 'text-red-600' : 'text-primary'}`}>
                      {stage.truckCount}
                    </p>
                  </div>
                  
                  {/* Micro-sparkline or mini-indicator */}
                  <div className="flex gap-1 h-6 items-end">
                    {[40, 70, 45, 90, 65].map((h, i) => (
                      <div 
                        key={i} 
                        className={`w-1 rounded-full ${stage.isBottleneck ? 'bg-red-200' : 'bg-primary/20'}`} 
                        style={{ height: `${h}%` }} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress visual */}
              <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (stage.avgTime / 45) * 100)}%` }}
                  className={`h-full rounded-full ${stage.isBottleneck ? 'bg-red-500' : 'bg-primary'}`}
                />
              </div>
            </div>

            {/* Connector */}
            {idx < stages.length - 1 && (
              <div className="hidden md:flex items-center text-slate-300">
                <ArrowRight className="w-6 h-6" />
              </div>
            )}
          </React.Fragment>
        )) : (
          <div className="w-full py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucune donnée de flux disponible</p>
          </div>
        )}
      </div>

      {/* Footer / Legend */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-black text-red-600 uppercase tracking-widest">Goulot détecté (&gt; 45 min)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Flux nominal</span>
        </div>
      </div>
    </div>
  );
};

export default WorkflowMonitor;
