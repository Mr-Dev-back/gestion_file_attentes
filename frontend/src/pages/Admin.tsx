import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Settings, ShieldCheck, Truck, Cpu, LayoutDashboard, Building2 } from 'lucide-react';
import { WorkflowManager } from '../components/admin/WorkflowManager';
import { QueueManager } from '../components/admin/QueueManager';
import { KioskManager } from '../components/admin/KioskManager';
import { CategoryManager } from '../components/admin/CategoryManager';
import { SettingsManager } from '../components/admin/SettingsManager';
import { RolePermissionManager } from '../components/admin/RolePermissionManager';
import { QuaiParameterManager } from '../components/admin/QuaiParameterManager';
import { UserManager } from '../components/admin/UserManager';
import { CompanySiteManager } from '../components/admin/CompanySiteManager';
import { SiteManager } from '../components/admin/SiteManager';

// Header section for Admin
const AdminHeader = () => {
  const location = useLocation();
  const path = location.pathname;

  let title = "Administration";
  let description = "Configuration globale du système";
  let Icon = Settings;
  let bgGradient = "from-primary/20 via-primary/5 to-transparent";

  if (path.includes('/stats') || path.includes('/reports') || path.includes('/audit')) {
    title = "Pilotage & Supervision";
    description = "Statistiques, rapports analytiques et audit système";
    Icon = LayoutDashboard;
    bgGradient = "from-blue-500/20 via-blue-500/5 to-transparent";
  } else if (path.includes('/workflows') || path.includes('/queues') || path.includes('/categories')) {
    title = "Exploitation Opérationnelle";
    description = "Gestion des workflows, catégories et files d'attente";
    Icon = Truck;
    bgGradient = "from-orange-500/20 via-orange-500/5 to-transparent";
  } else if (path.includes('/quais') || path.includes('/kiosks') || path.includes('/settings')) {
    title = "Parc Matériel & Paramétrage";
    description = "Configuration des quais, bornes et paramètres généraux";
    Icon = Cpu;
    bgGradient = "from-purple-500/20 via-purple-500/5 to-transparent";
  } else if (path.includes('/companies') || path.includes('/sites')) {
    title = "Structure Organisationnelle";
    description = "Gestion des sociétés et des sites";
    Icon = Building2;
    bgGradient = "from-emerald-500/20 via-emerald-500/5 to-transparent";
  } else if (path.includes('/users') || path.includes('/rbac') || path.includes('/roles') || path.includes('/permissions')) {
    title = "Accès & Sécurité";
    description = "Gestion des utilisateurs, rôles et permissions";
    Icon = ShieldCheck;
    bgGradient = "from-red-500/20 via-red-500/5 to-transparent";
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${bgGradient} border-b border-white/20 p-8 pt-10 pb-12`}>
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

export default function Admin() {
  // Protect the entire section if needed here, but App.tsx already does this for ADMIN/SUPERVISOR

  return (
    <div className="flex-1 w-full bg-slate-50/50 relative min-h-screen">
      {/* Decorative global background dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <Routes>
            <Route index element={<Navigate to="stats" replace />} />
            
            {/* Pilotage */}
            <Route path="stats" element={
              <div className="py-20 text-center space-y-4">
                <LayoutDashboard className="w-16 h-16 mx-auto text-primary/30" />
                <h2 className="text-2xl font-bold text-slate-700">Statistiques Globales</h2>
                <p className="text-slate-500">Module en cours de développement.</p>
              </div>
            } />
            <Route path="reports" element={
              <div className="py-20 text-center space-y-4">
                <LayoutDashboard className="w-16 h-16 mx-auto text-primary/30" />
                <h2 className="text-2xl font-bold text-slate-700">Rapports d'Activité</h2>
                <p className="text-slate-500">Module en cours de développement.</p>
              </div>
            } />
            <Route path="audit" element={
              <div className="py-20 text-center space-y-4">
                <ShieldCheck className="w-16 h-16 mx-auto text-primary/30" />
                <h2 className="text-2xl font-bold text-slate-700">Audit Système</h2>
                <p className="text-slate-500">Consultez l'historique de toutes les actions critiques.</p>
              </div>
            } />

            {/* Exploitation */}
            <Route path="workflows" element={<WorkflowManager />} />
            <Route path="queues" element={<QueueManager />} />
            <Route path="categories" element={<CategoryManager />} />

            {/* Parc Matériel */}
            <Route path="quais" element={<QuaiParameterManager />} />
            <Route path="kiosks" element={<KioskManager />} />
            <Route path="settings" element={<SettingsManager />} />

            {/* Organisation */}
            <Route path="companies" element={<CompanySiteManager />} />
            <Route path="sites" element={<SiteManager />} />

            {/* Sécurité */}
            <Route path="users" element={<UserManager />} />
            <Route path="roles" element={<RolePermissionManager defaultTab="roles" />} />
            <Route path="permissions" element={<RolePermissionManager defaultTab="permissions" />} />
            <Route path="rbac" element={<RolePermissionManager />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="stats" replace />} />
          </Routes>
      </main>
    </div>
  );
}
