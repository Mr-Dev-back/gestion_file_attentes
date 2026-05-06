import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Info, Loader2, X, ArrowRight, Truck, AlertTriangle, Filter, RefreshCw } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import type { SiteStatus } from '../../types/analytics';
import { useSites } from '../../hooks/useDashboardStats';
import { useManagerContext } from '../../pages/Manager';

const STATUS_COLORS = {
  fluid: 'bg-emerald-500',
  busy: 'bg-orange-500',
  congested: 'bg-red-500',
};

const STATUS_LABELS = {
  fluid: 'Fluide',
  busy: 'Chargé',
  congested: 'Critique',
};

export const SiteMap: React.FC = () => {
  const { setActiveSiteId, activeSiteId } = useManagerContext();
  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'fluid' | 'busy' | 'congested'>('all');
  const [refreshProgress, setRefreshProgress] = useState(0);
  
  const { data: sites, isLoading, isFetching, refetch } = useSites();

  // 1. AUTO-REFRESH Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshProgress((prev) => {
        if (prev >= 100) {
          refetch();
          return 0;
        }
        return prev + (100 / 600); 
      });
    }, 100);
    return () => clearInterval(interval);
  }, [refetch]);

  // Coordinates mapping
  const SITE_COORDINATES: Record<string, { x: number; y: number }> = {
    'ABIDJAN': { x: 78, y: 85 },
    'YOPOUGON': { x: 74, y: 83 },
    'SAN PEDRO': { x: 32, y: 90 },
    'BOUAKE': { x: 55, y: 55 },
    'YAMOUSSOUKRO': { x: 52, y: 68 },
    'KORHOGO': { x: 50, y: 25 },
    'MAN': { x: 25, y: 62 },
    'DALOA': { x: 42, y: 65 },
    'ABENGOUROU': { x: 85, y: 60 },
    'default': { x: 50, y: 50 }
  };

  const mappedSites: SiteStatus[] = useMemo(() => {
    return (sites || []).map((s, index) => {
      const baseCoords = SITE_COORDINATES[s.name.toUpperCase()] || SITE_COORDINATES.default;
      
      // If it's a default coordinate, add a slight jitter based on index to avoid stacking
      const jitterX = baseCoords === SITE_COORDINATES.default ? (index % 5) * 4 - 8 : 0;
      const jitterY = baseCoords === SITE_COORDINATES.default ? Math.floor(index / 5) * 4 - 4 : 0;

      return {
        id: s.siteId,
        name: s.name,
        truckCount: s.truckCount || 0,
        status: (s.truckCount || 0) > 20 ? 'congested' : (s.truckCount || 0) > 10 ? 'busy' : 'fluid',
        coordinates: {
          x: baseCoords.x + jitterX,
          y: baseCoords.y + jitterY
        }
      };
    });
  }, [sites]);

  const filteredSites = useMemo(() => {
    if (activeFilter === 'all') return mappedSites;
    return mappedSites.filter(s => s.status === activeFilter);
  }, [mappedSites, activeFilter]);

  const selectedSite = mappedSites.find(s => s.id === activeSiteId);

  // 5. HAPTIC FEEDBACK
  const handleSiteClick = (site: SiteStatus) => {
    setActiveSiteId(site.id);
    if (site.status === 'congested' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]); // Discret but multiple for critical
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-full aspect-square md:aspect-video bg-slate-900/5 rounded-[2.5rem] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <Tooltip.Provider delayDuration={0}>
      <div className={`relative w-full aspect-square md:aspect-video bg-slate-900/5 rounded-[3rem] p-8 border border-white/40 overflow-hidden backdrop-blur-sm shadow-inner group transition-opacity duration-500 ${isFetching ? 'opacity-70' : 'opacity-100'}`}>
        
        {/* Progress Bar (Auto-refresh) */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-200/30 z-20 overflow-hidden">
          <motion.div 
            className="h-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${refreshProgress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>

        {/* Header & Stats */}
        <div className="absolute top-8 left-8 z-10 flex flex-col gap-1">
          <div className={`flex items-center gap-3 transition-opacity duration-300 ${isFetching ? 'animate-pulse' : ''}`}>
            <div className="p-2.5 bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white">
              <MapPin className="text-primary w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Géo-Supervision</h3>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-none">Live • Côte d'Ivoire</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Legend (Filters) */}
        <div className="absolute top-8 right-8 flex flex-col gap-3 z-10">
          <div className="flex flex-col gap-2 bg-white/40 backdrop-blur-xl p-3 rounded-[2rem] border border-white/50 shadow-xl shadow-black/5">
            {(['all', 'congested', 'busy', 'fluid'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`flex items-center justify-between gap-3 px-4 py-2 rounded-2xl transition-all duration-300 group/btn ${
                  activeFilter === status 
                    ? 'bg-slate-800 text-white shadow-lg scale-105' 
                    : 'hover:bg-white/60 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status === 'all' ? 'bg-primary' : STATUS_COLORS[status]}`} />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {status === 'all' ? 'Tous' : STATUS_LABELS[status]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full max-h-[550px] drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)] opacity-90">
            <defs>
              <linearGradient id="mapGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f8fafc" />
              </linearGradient>
            </defs>
            <path d="M 25 10 Q 50 5 75 10 L 90 35 Q 95 60 85 90 Q 50 95 15 90 Q 5 60 10 35 Z" fill="url(#mapGradient)" stroke="#e2e8f0" strokeWidth="0.5" />
          </svg>

          {/* Site Markers */}
          <AnimatePresence>
            {filteredSites.map((site) => (
              <div key={site.id} className="absolute z-10" style={{ left: `${site.coordinates.x}%`, top: `${site.coordinates.y}%`, transform: 'translate(-50%, -50%)' }}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div className="relative">
                      {site.status === 'congested' && (
                        <motion.div animate={{ scale: [1, 2.5], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }} className="absolute inset-0 rounded-2xl bg-red-500/40" />
                      )}
                      <motion.button
                        layoutId={`marker-${site.id}`}
                        whileHover={{ scale: 1.15, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSiteClick(site)}
                        onMouseEnter={() => setHoveredSiteId(site.id)}
                        onMouseLeave={() => setHoveredSiteId(null)}
                        className={`relative w-10 h-10 rounded-[1rem] flex items-center justify-center shadow-xl cursor-pointer border-2 border-white transition-all duration-500 overflow-hidden ${
                          activeSiteId === site.id ? 'ring-4 ring-primary/20 scale-110' : ''
                        } ${STATUS_COLORS[site.status]}`}
                      >
                        <MapPin className="text-white w-5 h-5 drop-shadow-md" />
                      </motion.button>
                    </div>
                  </Tooltip.Trigger>
                  
                  <Tooltip.Portal>
                    <Tooltip.Content side="top" sideOffset={12} className="z-50 bg-slate-900/95 backdrop-blur-xl text-white p-5 rounded-[2rem] shadow-2xl border border-white/10">
                      <div className="space-y-3 min-w-[180px]">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-base tracking-tight">{site.name}</span>
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${site.status === 'fluid' ? 'bg-emerald-500 text-white' : site.status === 'busy' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'}`}>
                            {STATUS_LABELS[site.status]}
                          </span>
                        </div>
                        <div className="h-px bg-white/10" />
                        <div className={`flex flex-col gap-0.5 transition-opacity ${isFetching ? 'animate-pulse opacity-50' : ''}`}>
                          <span className="text-[10px] uppercase text-white/40 font-black tracking-widest leading-none">Actuellement</span>
                          <span className="text-xl font-black text-primary-light tracking-tighter leading-none">{site.truckCount} camions</span>
                        </div>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </div>
            ))}
          </AnimatePresence>
        </div>

        {/* Sidebar de Détails */}
        <AnimatePresence>
          {activeSiteId && selectedSite && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveSiteId(null)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-30" />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute top-0 right-0 h-full w-[350px] bg-white/95 backdrop-blur-2xl z-40 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] border-l border-white/50 p-8 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="p-3 bg-slate-100 rounded-2xl text-slate-800"><MapPin className="w-6 h-6" /></div>
                  <button onClick={() => setActiveSiteId(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                </div>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{selectedSite.name}</h4>
                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[selectedSite.status]} animate-pulse`} />
                  </div>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest leading-none">Détails opérationnels du site</p>
                </div>

                <div className="space-y-6 mb-10">
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Truck className="w-4 h-4" /> Flux par étape</h5>
                  <div className={`space-y-4 ${isFetching ? 'animate-pulse opacity-50' : ''}`}>
                    {[
                      { label: 'Entrée (Check-in)', value: Math.round(selectedSite.truckCount * 0.4), color: 'bg-blue-500' },
                      { label: 'Fret (En cours)', value: Math.round(selectedSite.truckCount * 0.35), color: 'bg-purple-500' },
                      { label: 'Sortie (Pesée)', value: Math.round(selectedSite.truckCount * 0.25), color: 'bg-orange-500' },
                    ].map((step) => (
                      <div key={step.label}>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-bold text-slate-600">{step.label}</span>
                          <span className="text-lg font-black text-slate-800">{step.value}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(step.value / selectedSite.truckCount) * 100}%` }} className={`h-full ${step.color}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Points de blocage</h5>
                  <div className={`space-y-3 ${isFetching ? 'animate-pulse opacity-50' : ''}`}>
                    {[
                      { title: 'Attente Pont-Bascule', severity: selectedSite.status === 'congested' ? 'CRITIQUE' : 'ÉLEVÉ', time: '45min' },
                      { title: 'Disponibilité Quais', severity: 'MODÉRÉ', time: '12min' },
                      { title: 'Validation Bureau', severity: 'FLUIDE', time: '5min' },
                    ].map((alert, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-slate-700 text-sm">{alert.title}</p>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${alert.severity === 'CRITIQUE' ? 'bg-red-500 text-white' : alert.severity === 'ÉLEVÉ' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{alert.severity}</span>
                        </div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Est. {alert.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </Tooltip.Provider>
  );
};

export default SiteMap;
