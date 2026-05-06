import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Building2, LayoutDashboard, Zap, MapPinned, Search } from 'lucide-react';
import SupervisorTactical from './supervisor/SupervisorTactical';
import SupervisorDashboard from './dashboards/SupervisorDashboard';
import LiveTracking from './supervisor/LiveTracking';
import VehicleSearch from './supervisor/VehicleSearch';

// ─── Harmonized Header (same structure as Manager) ─────────────────────────
const SupervisorHeader = () => {
  const location = useLocation();
  const path = location.pathname;

  let title = "Espace Superviseur";
  let description = "Pilotage opérationnel et régulation du site en temps réel";
  let Icon = Building2;
  let bgGradient = "from-emerald-500/20 via-emerald-500/5 to-transparent";
  let iconColor = "text-emerald-600";

  if (path.includes('workflow-view')) {
    title = "Régulation Temps Réel";
    description = "Gestion synoptique des flux et optimisation des cadencements.";
    Icon = Zap;
    bgGradient = "from-amber-500/20 via-amber-500/5 to-transparent";
    iconColor = "text-amber-600";
  } else if (path.includes('live-tracking')) {
    title = "Tracking Véhicules";
    description = "Suivi précis de la position de chaque transporteur sur site.";
    Icon = MapPinned;
    bgGradient = "from-blue-500/20 via-blue-500/5 to-transparent";
    iconColor = "text-blue-600";
  } else if (path.includes('dashboard')) {
    title = "Performance Site";
    description = "Statistiques consolidées et KPIs de productivité du site.";
    Icon = LayoutDashboard;
    bgGradient = "from-indigo-500/20 via-indigo-500/5 to-transparent";
    iconColor = "text-indigo-600";
  } else if (path.includes('search')) {
    title = "Recherche & Archives";
    description = "Consultez l'historique complet des tickets et exportez les rapports.";
    Icon = Search;
    bgGradient = "from-slate-500/20 via-slate-500/5 to-transparent";
    iconColor = "text-slate-600";
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${bgGradient} border-b border-white/20 p-8 pt-10 pb-12 transition-colors duration-500`}>
      {/* Decorative icon watermark */}
      <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
        <Icon className="w-48 h-48 rotate-12" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex items-center gap-6">
        <div className="p-4 bg-white/40 backdrop-blur-md rounded-2xl shadow-xl shadow-black/5 border border-white/50">
          <Icon className={`w-10 h-10 ${iconColor}`} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 filter drop-shadow-sm tracking-tight mb-1 uppercase">
            {title}
          </h1>
          <p className="text-slate-500 font-medium text-base max-w-2xl">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Main Supervisor Page ────────────────────────────────────────────────────
export default function Supervisor() {
  return (
    <div className="flex-1 w-full bg-slate-50/50 relative min-h-screen">
      {/* Same dot-grid background as Manager */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

      <SupervisorHeader />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 -mt-8">
        {/* Same glass card container as Manager */}
        <div className="bg-white/60 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-6 md:p-8 border border-white/60 min-h-[700px]">
          <Routes>
            <Route index element={<Navigate to="workflow-view" replace />} />

            <Route path="workflow-view" element={<SupervisorTactical />} />

            <Route path="live-tracking" element={<LiveTracking />} />

            <Route path="dashboard" element={<SupervisorDashboard />} />

            <Route path="search" element={<VehicleSearch />} />

            <Route path="*" element={<Navigate to="workflow-view" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
