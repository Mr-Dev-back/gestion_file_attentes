import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Building2, TrendingUp, Zap, MapPinned, Search, History, Activity, Truck } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import InteractiveWorkflowView from './supervisor/InteractiveWorkflowView';
import SupervisorDashboard from './dashboards/SupervisorDashboard';

// Header section for Supervisor
const SupervisorHeader = () => {
  const location = useLocation();
  const path = location.pathname;
  const { user } = useAuthStore();
  const userSiteName = (user as any)?.site?.name || "Site Actuel";

  let title = `Espace Opérationnel`;
  let description = `Supervision tactique du ${userSiteName}`;
  let Icon = Building2;
  let bgGradient = "from-primary/20 via-primary/5 to-transparent";

  // Match the paths with the 3 poles
  if (path.includes('/workflow-view') || path.includes('/live-tracking') || path.includes('/search')) {
    title = `Gestion du ${userSiteName}`;
    description = "Vue d'ensemble en temps réel et localisation des camions sur le site.";
    Icon = MapPinned;
    bgGradient = "from-blue-500/20 via-blue-500/5 to-transparent";
  } else if (path.includes('/priorities') || path.includes('/manual-dispatch')) {
    title = "Régulation & Interventions";
    description = "Gestion des urgences, fast-pass et réaffectations manuelles.";
    Icon = Zap;
    bgGradient = "from-red-500/20 via-orange-500/5 to-transparent";
  } else if (path.includes('/history') || path.includes('/dashboard')) {
    title = "Analyse Locale";
    description = "Statistiques de performance du site et historique des opérations.";
    Icon = TrendingUp;
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
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-main to-primary filter drop-shadow-sm tracking-tight mb-2">
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

// Generic Placeholder Component for Views in construction
const ViewPlaceholder = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
  <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-6">
    <div className="p-6 bg-primary/5 rounded-full ring-8 ring-primary/5 shadow-inner">
      <Icon className="w-16 h-16 text-primary/40" />
    </div>
    <div className="max-w-md space-y-2">
      <h2 className="text-2xl font-black text-slate-700 tracking-tight">{title}</h2>
      <p className="text-slate-500 font-medium leading-relaxed">
        {description}
      </p>
    </div>
    <div className="pt-4 flex items-center gap-3 text-sm text-primary/60 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-black/5">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary/40"></span>
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
        <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-6 md:p-8 border border-white/60 min-h-[500px]">
          <Routes>
            <Route index element={<Navigate to="workflow-view" replace />} />
            
            {/* 1. Gestion du Site */}
            <Route path="workflow-view" element={<InteractiveWorkflowView />} />
            <Route path="live-tracking" element={<ViewPlaceholder 
              title="Tracking Temps Réel" 
              description="Suivi minute par minute des déplacements, statuts des tickets et alertes immédiates du site." 
              icon={Activity} />} 
            />
            <Route path="search" element={<ViewPlaceholder 
              title="Recherche Véhicule" 
              description="Localisation immédiate sur le site via la saisie d'un numéro d'immatriculation ou de ticket." 
              icon={Search} />} 
            />

            {/* 2. Régulation */}
            <Route path="priorities" element={<ViewPlaceholder 
              title="Urgences & Fast-Pass" 
              description="Modification de l'ordre de passage et attribution du statut VIP/Urgent surchargé aux transporteurs critiques." 
              icon={Zap} />} 
            />
            <Route path="manual-dispatch" element={<ViewPlaceholder 
              title="Dispatch & Transferts" 
              description="Réaffectation manuelle et forcée de files d'attente lors de pannes ou anomalies matérielles." 
              icon={Truck} />} 
            />

            {/* 3. Analyse Locale */}
            <Route path="dashboard" element={<SupervisorDashboard />} />
            <Route path="history" element={<ViewPlaceholder 
              title="Audit & Historique Local" 
              description="Journaux archivés pour vérifier les opérations passées et gérer les litiges spécifiques au site." 
              icon={History} />} 
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="workflow-view" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
