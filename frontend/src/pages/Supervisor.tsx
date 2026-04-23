import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Building2, Activity, Truck, History, LayoutDashboard, Search, Zap, MapPinned } from 'lucide-react';
import SupervisorTactical from './supervisor/SupervisorTactical';
import SupervisorDashboard from './dashboards/SupervisorDashboard';

// Header section for Supervisor (Harmonized with Manager)
const SupervisorHeader = () => {
  const location = useLocation();
  const path = location.pathname;

  let title = "Espace Superviseur";
  let description = "Pilotage opérationnel et régulation du site";
  let Icon = Building2;
  let bgGradient = "from-emerald-500/20 via-emerald-500/5 to-transparent";

  if (path.includes('/workflow-view')) {
    title = "Régulation Temps Réel";
    description = "Gestion synoptique des flux et optimisation des cadencements.";
    Icon = Zap;
    bgGradient = "from-amber-500/20 via-amber-500/5 to-transparent";
  } else if (path.includes('/live-tracking')) {
    title = "Tracking Véhicules";
    description = "Suivi précis de la position de chaque transporteur sur site.";
    Icon = MapPinned;
    bgGradient = "from-blue-500/20 via-blue-500/5 to-transparent";
  } else if (path.includes('/dashboard')) {
    title = "Performance Site";
    description = "Statistiques consolidées et KPIs de productivité.";
    Icon = LayoutDashboard;
    bgGradient = "from-indigo-500/20 via-indigo-500/5 to-transparent";
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${bgGradient} border-b border-white/20 p-8 pt-10 pb-12 transition-colors duration-500`}>
      {/* Decorative background elements blur */}
      <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
        <Icon className="w-48 h-48 rotate-12" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex items-center gap-6">
        <div className="p-4 bg-white/40 backdrop-blur-md rounded-2xl shadow-xl shadow-black/5 border border-white/50">
          <Icon className="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-emerald-600 filter drop-shadow-sm tracking-tight mb-2 uppercase">
            {title}
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl leading-tight">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

const ViewPlaceholder = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
  <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-6">
    <div className="p-6 bg-emerald-500/5 rounded-full ring-8 ring-emerald-500/5 shadow-inner">
      <Icon className="w-16 h-16 text-emerald-500/40" />
    </div>
    <div className="max-w-md space-y-2">
      <h2 className="text-2xl font-black text-slate-700 tracking-tight uppercase">{title}</h2>
      <p className="text-slate-500 font-medium leading-relaxed">
        {description}
      </p>
    </div>
    <div className="pt-4 flex items-center gap-3 text-sm text-emerald-600 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-black/5">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-20"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500/40"></span>
      </span>
      En cours de développement
    </div>
  </div>
);

export default function Supervisor() {
  return (
    <div className="flex-1 w-full bg-slate-50/50 relative min-h-screen">
      {/* Decorative global background dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

      <SupervisorHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 -mt-8">
        <div className="bg-white/60 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-6 md:p-8 border border-white/60 min-h-[700px]">
          <Routes>
            <Route index element={<Navigate to="/supervisor/workflow-view" replace />} />
            
            <Route path="workflow-view" element={<SupervisorTactical />} />
            
            <Route path="live-tracking" element={<ViewPlaceholder 
              title="Tracking Temps Réel" 
              description="Suivi minute par minute des déplacements, statuts des tickets et alertes immédiates du site." 
              icon={MapPinned} />} 
            />

            <Route path="priorities" element={<Navigate to="/supervisor/workflow-view" replace />} />
            <Route path="manual-dispatch" element={<Navigate to="/supervisor/workflow-view" replace />} />
            
            <Route path="dashboard" element={<SupervisorDashboard />} />
            
            <Route path="search" element={<ViewPlaceholder 
              title="Recherche & Archives" 
              description="Consultez l'historique complet des tickets du site et exportez les rapports de pesée." 
              icon={Search} />} 
            />

            <Route path="history" element={<ViewPlaceholder 
              title="Historique du Site" 
              description="Consultez la liste chronologique des entrées et sorties traitées sur votre site." 
              icon={History} />} 
            />

            <Route path="*" element={<Navigate to="/supervisor/workflow-view" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
