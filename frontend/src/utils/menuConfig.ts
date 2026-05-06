import {
  LayoutDashboard,
  Home,
  ListOrdered,
  Settings,
  BarChart3,
  Truck,
  Cpu,
  ShieldCheck,
  Activity,
  Tags,
  Globe,
  GitBranch,
  ClipboardCheck,
  FileText,
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
    roles: ['ADMINISTRATOR', 'MANAGER', 'SUPERVISOR'],
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
      { label: "Reporting", path: "/reporting", icon: FileText },
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
    title: "Pilotage Société",
    icon: Globe,
    items: [
      { label: "Cartographie des Sites", path: "/manager/map", icon: Globe },
      { label: "Performance Globale", path: "/manager/dashboard", icon: LayoutDashboard },
      { label: "Comparatif Sites", path: "/manager/benchmark", icon: BarChart3 }
    ]
  },
  {
    isGroup: true,
    title: "Flux & Workflows",
    icon: GitBranch, 
    items: [
      { label: "Suivi des Workflows", path: "/manager/workflows/monitor", icon: GitBranch },
      { label: "Gestion des Alertes", path: "/manager/alerts", icon: Activity }
    ]
  },
  {
    isGroup: true,
    title: "Analyses & Rapports",
    icon: BarChart3,
    items: [
      { label: "Rapports d'Activité", path: "/manager/reports", icon: FileText },
      { label: "Statistiques Produits", path: "/manager/stats/categories", icon: BarChart3 },
      { label: "Temps de Traitement", path: "/manager/stats/timing", icon: Activity }
    ]
  },
  {
    isGroup: true,
    title: "Contrôle",
    icon: ClipboardCheck,
    items: [
      { label: "Historique des Tickets", path: "/manager/history", icon: History },
      { label: "Audit des Opérations", path: "/manager/audit", icon: ClipboardCheck }
    ]
  }
];

/**
 * Structure de menus pour les Superviseurs.
 */
const supervisorMenuGroups: MenuGroup[] = [
  {
    isGroup: true,
    title: "Régulation Site",
    icon: Zap,
    items: [
      { label: "Synoptique Workflow", path: "/supervisor/workflow-view", icon: Zap },
      { label: "Suivi Temps Réel",   path: "/supervisor/live-tracking",  icon: Activity },
      { label: "Recherche Véhicule", path: "/supervisor/search",         icon: Search }
    ]
  },
  {
    isGroup: true,
    title: "Analyse & Contrôle",
    icon: TrendingUp,
    items: [
      { label: "Stats de mon Site",  path: "/supervisor/dashboard",      icon: TrendingUp },
      { label: "Cartographie",       path: "/supervisor/live-tracking",  icon: MapPinned }
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

  // Si l'utilisateur est administrateur, on lui renvoie uniquement la structure stricte de l'admin
  if (role === 'ADMINISTRATOR') {
    return [...adminMenuGroups];
  }

  // Si l'utilisateur est manager, on lui renvoie la structure par pôles Manager (la borne/entrée est exclue des groupes, on la remet si on veut, ou juste ses pôles)
  if (role === 'MANAGER') {
    const entryItem: MenuItem = { isGroup: false, label: 'Borne / Entrée', icon: Home, path: '/' };
    return [
      entryItem,
      ...managerMenuGroups
    ];
  }

  // Si l'utilisateur est superviseur, il garde la vue des quais et a accès à son tableau de bord opérationnel
  if (role === 'SUPERVISOR') {
    const dynamicQuaiGroup: MenuGroup | null = dynamicQuais.length > 0 ? {
      isGroup: true,
      title: "Accès Quais",
      icon: ListOrdered,
      items: dynamicQuais.map((quai) => ({
        label: quai.label,
        icon: ListOrdered,
        path: `/quai/${quai.quaiId}`,
      }))
    } : null;
    
    const entryItem: MenuItem = { isGroup: false, label: 'Borne / Entrée', icon: Home, path: '/' };
    return [
      entryItem,
      ...(dynamicQuaiGroup ? [dynamicQuaiGroup] : []),
      ...supervisorMenuGroups
    ];
  }

  // Comportement pour l'Agent de Quai
  if (role === 'AGENT_QUAI' || role === 'AGENT_GUERITE') {
    return [
      {
        isGroup: false,
        label: 'Poste Opérationnel',
        icon: Zap,
        path: '/operational',
      },
      {
        isGroup: false,
        label: "File d'Attente",
        icon: ListOrdered,
        path: '/queue',
      }
    ];
  }

  // Rôle Exploitation : accès opérationnel + pilotage de base
  if (role === 'EXPLOITATION') {
    return [
      { isGroup: false, label: 'Poste Opérationnel', icon: Zap, path: '/operational' },
      { isGroup: false, label: "File d'Attente", icon: ListOrdered, path: '/queue' },
      { isGroup: false, label: 'Rapports', icon: BarChart3, path: '/reporting' },
    ];
  }

  // Fallback for other roles (like Supervisor)
  const dashboardItem = dashboardMenuItems[role];

  const accessibleStaticItems = allMenuItems.filter((item) => {
    if (item.isGroup) return false;
    if (item.roles && !item.roles.includes(role)) return false;
    if (item.requiredPermission) {
      return user.permissions?.includes(item.requiredPermission) || 
             user.permissionCodes?.includes(item.requiredPermission);
    }
    return true;
  }) as MenuItem[];

  const dynamicQuaiGroup: MenuGroup | null = dynamicQuais.length > 0 ? {
    isGroup: true,
    title: "Accès Quais",
    icon: ListOrdered,
    items: dynamicQuais.map((quai) => ({
      label: quai.label,
      icon: ListOrdered,
      path: `/quai/${quai.quaiId}`,
    }))
  } : null;

  return [
    ...(dashboardItem ? [{ ...(dashboardItem as MenuItem), isGroup: false as const }] : []),
    ...(dynamicQuaiGroup ? [dynamicQuaiGroup] : []),
    ...accessibleStaticItems,
  ].filter((item, index, self) => {
      // Déduplication par path
      const firstIndex = self.findIndex((t) => !t.isGroup && !item.isGroup && t.path === item.path);
      return index === firstIndex || item.isGroup;
  });
};
