import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  'admin': 'Administration',
  'users': 'Utilisateurs',
  'roles': 'Rôles',
  'permissions': 'Permissions',
  'sites': 'Sites',
  'companies': 'Compagnies',
  'categories': 'Catégories',
  'queues': 'Files d\'attente',
  'workflows': 'Workflows',
  'audit': 'Boîte Noire',
  'analytics': 'Dashboards',
  'summary': 'Synthèse',
  'productivity': 'Productivité',
  'tickets': 'Tickets',
  'kiosks': 'Bornes',
  'displays': 'Affichages',
  'profile': 'Profil',
  'settings': 'Paramètres'
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-xs font-bold mb-6" aria-label="Breadcrumb">
      <Link
        to="/"
        className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1.5"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Accueil</span>
      </Link>

      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label = routeLabels[value] || value;

        return (
          <div key={to} className="flex items-center space-x-2 group">
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            {last ? (
              <span className="text-primary italic">
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest text-[10px]"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
