import React, { createContext, useState, useContext, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Globe, GitBranch, BarChart3, ClipboardCheck, LayoutDashboard, Truck, History, FileText, Activity } from 'lucide-react';
import ManagerDashboard from './dashboards/ManagerDashboard';
import SiteMap from '../components/analytics/SiteMap';
import CategoryDistribution from '../components/analytics/CategoryDistribution';
import WorkflowMonitor from '../components/analytics/WorkflowMonitor';
import ArchiveSearch from './ArchiveSearch';
import ManagerAlerts from './manager/ManagerAlerts';
import ManagerTiming from './manager/ManagerTiming';
import ManagerAudit from './manager/ManagerAudit';

// 1. GLOBAL CONTEXT
interface ManagerContextType {
  activeSiteId: string | null;
  setActiveSiteId: (id: string | null) => void;
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export const useManagerContext = () => {
  const context = useContext(ManagerContext);
  if (!context) throw new Error('useManagerContext must be used within a ManagerProvider');
  return context;
};

// Header section for Manager
const ManagerHeader = () => {
  const location = useLocation();
  const path = location.pathname;
  const { activeSiteId } = useManagerContext();

  let title = "Espace Manager";
  let description = "Vue d'ensemble et pilotage de l'activité";
  let Icon = Globe;
  let bgGradient = "from-primary/20 via-primary/5 to-transparent";

  // Match the paths with the 4 poles
  if (path.includes('/map') || path.includes('/dashboard') || path.includes('/benchmark')) {
    title = activeSiteId ? `Pilotage • Site ${activeSiteId.slice(0, 8)}` : "Pilotage Société";
    description = "Vision stratégique et état de santé global des différents sites.";
    Icon = Globe;
    bgGradient = "from-blue-500/20 via-blue-500/5 to-transparent";
  } else if (path.includes('/workflows') || path.includes('/alerts')) {
    title = "Flux & Workflows";
    description = "Supervision opérationnelle en temps réel des flux physiques.";
    Icon = GitBranch;
    bgGradient = "from-orange-500/20 via-orange-500/5 to-transparent";
  } else if (path.includes('/reports') || path.includes('/stats/')) {
    title = "Analyses & Rapports";
    description = "Statistiques décisionnelles et analytique avancée.";
    Icon = BarChart3;
    bgGradient = "from-purple-500/20 via-purple-500/5 to-transparent";
  } else if (path.includes('/history') || path.includes('/audit')) {
    title = "Traçabilité & Contrôle";
    description = "Historique consolidé et vérification de la conformité.";
    Icon = ClipboardCheck;
    bgGradient = "from-emerald-500/20 via-emerald-500/5 to-transparent";
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${bgGradient} border-b border-white/20 p-8 pt-10 pb-12 transition-colors duration-500`}>
      {/* Decorative background elements blur */}
      <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
        <Icon className="w-48 h-48 rotate-12" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex items-center gap-6">
        <div className="p-4 bg-white/40 backdrop-blur-md rounded-2xl shadow-xl shadow-black/5 border border-white/50">
          <Icon className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-main to-primary filter drop-shadow-sm tracking-tight mb-2 uppercase">
            {title}
          </h1>
          <p className="text-text-muted font-medium text-lg max-w-2xl">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Manager() {
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);

  const contextValue = useMemo(() => ({
    activeSiteId,
    setActiveSiteId
  }), [activeSiteId]);

  return (
    <ManagerContext.Provider value={contextValue}>
      <div className="flex-1 w-full bg-slate-50/50 relative min-h-screen">
        {/* Decorative global background dots */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        <ManagerHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 -mt-8">
          <div className="bg-white/60 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-6 md:p-8 border border-white/60 min-h-[600px]">
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              
              {/* 1. Pilotage Société */}
              <Route path="map" element={<SiteMap />} />
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="benchmark" element={<CategoryDistribution />} />

              {/* 2. Flux & Workflows */}
              <Route path="workflows/monitor" element={<WorkflowMonitor />} />
              <Route path="alerts" element={<ManagerAlerts />} />

              {/* 3. Analyses & Rapports */}
              <Route path="reports" element={<ArchiveSearch />} />
              <Route path="stats/categories" element={<CategoryDistribution />} />
              <Route path="stats/timing" element={<ManagerTiming />} />

              {/* 4. Contrôle */}
              <Route path="history" element={<ArchiveSearch />} />
              <Route path="audit" element={<ManagerAudit />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </ManagerContext.Provider>
  );
}
