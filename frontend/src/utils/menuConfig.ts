import {
  LayoutDashboard,
  Home,
  ListOrdered,
  Settings,
  BarChart3,
  Cpu,
  ShieldCheck,
  Activity,
  Tags,
  Globe,
  GitBranch,
  Building2,
  History,
  Zap,
  TrendingUp,
  MapPinned,
  Search,
  User as UserIcon,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '../stores/useAuthStore';

/**
 * Interface pour les éléments de menu (statiques et dynamiques).
 */
export interface MenuItem {
  isGroup?: false;
  label: string;
  icon: LucideIcon;
  path: string;
  roles?: UserRole[];
  requiredPermission?: string;
}

export interface MenuGroup {
  isGroup: true;
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
}

export type MenuElement = MenuItem | MenuGroup;

/**
 * Interface pour les données des quais dynamiques provenant de l'API.
 */
export interface QuaiMenuData {
  quaiId: string;
  label: string;
}

interface MenuUser {
  role: UserRole;
  permissions?: string[];
  permissionCodes?: string[];
}

/**
 * Menus statiques de l'application avec leurs contraintes d'accès.
 */
const allMenuItems: MenuElement[] = [
  {
    isGroup: false,
    label: 'Borne / Entrée',
    icon: Home,
    path: '/',
  },
  {
    isGroup: false,
    label: "File d'Attente",
    icon: ListOrdered,
    path: '/queue',
    roles: ['ADMINISTRATOR', 'MANAGER', 'SUPERVISOR'],
  },
  {
    isGroup: false,
    label: 'Rapports',
    icon: BarChart3,
    path: '/reporting',
    roles: ['MANAGER'],
  },
  {
    isGroup: false,
    label: 'Rapports Détaillés',
    icon: History,
    path: '/reporting-detailed',
    roles: ['MANAGER'],
  },
];

/**
 * Structure de menus pour les Administrateurs.
 */
const adminMenuGroups: MenuGroup[] = [
  {
    isGroup: true,
    title: "Tableau de Bord",
    icon: LayoutDashboard,
    items: [
      { label: "Vue d'ensemble", path: "/dashboard/admin", icon: LayoutDashboard },
      { label: "Audit & Logs", path: "/admin/audit", icon: History }
    ]
  },
  {
    isGroup: true,
    title: "Exploitation",
    icon: Activity,
    items: [
      { label: "Workflows", path: "/admin/workflows", icon: GitBranch },
      { label: "Files d'attente", path: "/admin/queues", icon: ListOrdered },
      { label: "Catégories", path: "/admin/categories", icon: Tags }
    ]
  },
  {
    isGroup: true,
    title: "Parc Matériel",
    icon: Cpu,
    items: [
      { label: "Quais", path: "/admin/quais", icon: Settings },
      { label: "Bornes", path: "/admin/kiosks", icon: Settings },
      { label: "Paramètres Système", path: "/admin/settings", icon: Settings }
    ]
  },
  {
    isGroup: true,
    title: "Organisation",
    icon: Building2,
    items: [
      { label: "Sociétés", path: "/admin/companies", icon: Building2 },
      { label: "Sites", path: "/admin/sites", icon: MapPinned }
    ]
  },
  {
    isGroup: true,
    title: "Accès & Sécurité",
    icon: ShieldCheck,
    items: [
      { label: "Utilisateurs", path: "/admin/users", icon: UserIcon },
      { label: "Rôles", path: "/admin/roles", icon: ShieldCheck },
      { label: "Permissions", path: "/admin/permissions", icon: ShieldCheck }
    ]
  }
];

/**
 * Structure de menus pour les Managers.
 */
const managerMenuGroups: MenuGroup[] = [
  {
    isGroup: true,
    title: "Pilotage & Performance",
    icon: LayoutDashboard,
    items: [
      { label: "Performance Globale", path: "/manager/dashboard", icon: LayoutDashboard },
      { label: "Cartographie des Sites", path: "/manager/map", icon: Globe },
      { label: "Reporting Synthétique", path: "/reporting", icon: BarChart3 }
    ]
  },
  {
    isGroup: true,
    title: "Analyse des Flux",
    icon: Activity,
    items: [
      { label: "Reporting Détaillé", path: "/reporting-detailed", icon: History },
      { label: "Suivi des Workflows", path: "/manager/workflows/monitor", icon: GitBranch },
      { label: "Gestion des Alertes", path: "/manager/alerts", icon: Activity },
      { label: "Temps de Traitement", path: "/manager/stats/timing", icon: Activity }
    ]
  }
];

/**
 * Structure de menus pour les Superviseurs.
 */
const supervisorMenuGroups: MenuGroup[] = [
  {
    isGroup: true,
    title: "Pilotage Opérationnel",
    icon: Zap,
    items: [
      { label: "Synoptique Workflow", path: "/supervisor/workflow-view", icon: Zap },
      { label: "Tracking Véhicules", path: "/supervisor/live-tracking", icon: MapPinned },
      { label: "Recherche & Archives", path: "/supervisor/search", icon: Search }
    ]
  },
  {
    isGroup: true,
    title: "Analyse & Performance",
    icon: TrendingUp,
    items: [
      { label: "Statistiques Site", path: "/supervisor/dashboard", icon: TrendingUp }
    ]
  }
];

/**
 * Dashboards spécifiques par rôle.
 */
const dashboardMenuItems: Partial<Record<UserRole, MenuItem>> = {
  ADMINISTRATOR: {
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    path: '/dashboard/admin',
  },
  SUPERVISOR: {
    label: 'Supervision',
    icon: LayoutDashboard,
    path: '/supervisor',
  },
  MANAGER: {
    label: 'Statistiques',
    icon: LayoutDashboard,
    path: '/manager',
  },
};

/**
 * Génère la liste des menus filtrée par rôle/permission et augmentée des quais dynamiques.
 * 
 * @param user - L'utilisateur actuel du store Auth.
 * @param dynamicQuais - Liste des quais récupérés via l'API.
 * @returns Liste dédupliquée des éléments de menu accessibles.
 */
export const getMenuItems = (
  user: MenuUser | null,
  dynamicQuais: QuaiMenuData[] = []
): MenuElement[] => {
  if (!user) return [];

  const role = user.role as UserRole;

  // 0. Préparation des quais dynamiques (si applicables)
  const dynamicQuaiGroup: MenuGroup | null = dynamicQuais.length > 0 ? {
    isGroup: true,
    title: 'Mes Quais',
    icon: Zap,
    items: dynamicQuais.map((q) => ({
      label: q.label,
      path: `/quai/${q.quaiId}`,
      icon: Zap,
    })),
  } : null;

  // 1. Structure stricte pour l'Administrateur (Pas de Borne/Entrée ici)
  if (role === 'ADMINISTRATOR') {
    return [...adminMenuGroups];
  }

  // 2. Structure pour le Manager
  if (role === 'MANAGER') {
    return [
      { isGroup: false, label: 'Borne / Entrée', icon: Home, path: '/' },
      ...managerMenuGroups
    ];
  }

  // 3. Structure pour le Superviseur (Supervision uniquement)
  if (role === 'SUPERVISOR') {
    return [
      ...supervisorMenuGroups,
      ...(dynamicQuaiGroup ? [dynamicQuaiGroup] : [])
    ];
  }

  // 4. Agent de Quai / Guérite
  if (role === 'AGENT_QUAI' || role === 'AGENT_GUERITE') {
    return [
      { isGroup: false, label: 'Poste Opérationnel', icon: Zap, path: '/operational' },
      { isGroup: false, label: "File d'Attente", icon: ListOrdered, path: '/queue' },
      ...(dynamicQuaiGroup ? [dynamicQuaiGroup] : [])
    ];
  }

  // 5. Exploitation
  if (role === 'EXPLOITATION') {
    return [
      { isGroup: false, label: 'Poste Opérationnel', icon: Zap, path: '/operational' },
      { isGroup: false, label: "File d'Attente", icon: ListOrdered, path: '/queue' },
      ...(dynamicQuaiGroup ? [dynamicQuaiGroup] : [])
    ];
  }

  // Fallback et déduplication pour les autres cas
  const dashboardItem = dashboardMenuItems[role];
  const accessibleStaticItems = allMenuItems.filter((item) => {
    if (item.isGroup) return false;
    if (item.roles && !item.roles.includes(role)) return false;
    return true;
  }) as MenuItem[];

  return [
    ...(dashboardItem ? [{ ...(dashboardItem as MenuItem), isGroup: false } as MenuItem] : []),
    ...accessibleStaticItems,
    ...(dynamicQuaiGroup ? [dynamicQuaiGroup] : [])
  ].filter((item, index, self) => {
      const firstIndex = self.findIndex((t) => !t.isGroup && !item.isGroup && t.path === item.path);
      return index === firstIndex || item.isGroup;
  });
};
