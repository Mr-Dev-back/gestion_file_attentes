import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, ChevronLeft, Menu, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../atoms/ui/button';
import { useAuthStore } from '../../../stores/useAuthStore';
import { getMenuItems, type QuaiMenuData } from '../../../utils/menuConfig';
import { api } from '../../../services/api';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

/**
 * Structure de réponse attendue de l'API pour les quais actifs.
 */
interface QuaiApiResponse {
  quaiId: string;
  label: string;
}

/**
 * Composant de navigation latérale dynamique.
 * Gère le chargement des quais en temps réel et les permissions d'accès.
 */
export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const { user, logout } = useAuthStore();
  
  // États locaux pour la gestion dynamique des quais
  const [quais, setQuais] = useState<QuaiMenuData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Effet de chargement des données dynamiques au montage ou changement d'utilisateur.
   */
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchActiveQuais = async () => {
      try {
        setIsLoading(true);
        // Appel API vers le endpoint des quais actifs
        const response = await api.get<QuaiApiResponse[]>('/quais/active');
        
        // Mapping vers notre interface interne
        const mappedQuais: QuaiMenuData[] = response.data.map((q) => ({
          quaiId: q.quaiId,
          label: q.label,
        }));
        
        setQuais(mappedQuais);
      } catch (error) {
        console.error("Échec de la récupération des quais:", error);
        setQuais([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveQuais();
  }, [user]);

  // Calcul des menus accessibles
  const menuItems = getMenuItems(user, quais);

  if (!user) return null;

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-40 h-screen flex flex-col bg-white border-r border-slate-100 shadow-xl transition-all duration-300',
      collapsed ? 'w-20' : 'w-64'
    )}>
      {/* Header : Logo & Toggle */}
      <div className="flex h-20 items-center justify-between px-6 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <img src="/sibm.png" alt="Logo" className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-800 leading-none">GFA</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-primary transition-colors"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      {/* Navigation : Menu dynamique & statique */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            {!collapsed && <span className="text-xs font-medium italic">Chargement...</span>}
          </div>
        ) : (
          menuItems.map((item, index) => {
            if (item.isGroup) {
              return (
                <div key={`group-${index}`} className={cn("pt-4 pb-2", collapsed ? "px-0 text-center" : "px-2")}>
                  {!collapsed ? (
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-black tracking-widest uppercase text-slate-400">
                      <item.icon className="h-3 w-3" />
                      {item.title}
                    </div>
                  ) : (
                    <div className="w-full flex justify-center mb-2" title={item.title}>
                      <item.icon className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                  <div className="space-y-1">
                    {item.items.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 group text-sm font-bold',
                            collapsed ? 'justify-center px-0' : 'justify-start',
                            isActive
                              ? 'bg-primary text-white shadow-md shadow-primary/20'
                              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                          )
                        }
                      >
                        <subItem.icon className={cn('h-5 w-5 shrink-0 transition-transform', !collapsed && 'group-hover:scale-110')} />
                        {!collapsed && <span className="truncate">{subItem.label}</span>}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            } else {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group text-sm font-bold',
                      collapsed ? 'justify-center px-0' : 'justify-start',
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    )
                  }
                >
                  <item.icon className={cn('h-5 w-5 shrink-0 transition-transform', !collapsed && 'group-hover:scale-110')} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            }
          })
        )}
      </nav>

      {/* Footer : Actions utilisateur */}
      <div className="p-4 border-t border-slate-50">
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            'w-full h-12 justify-start text-red-500 hover:bg-red-50 hover:text-red-600 rounded-2xl font-bold transition-all',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span className="ml-3 uppercase tracking-widest text-xs">Déconnexion</span>}
        </Button>
      </div>
    </aside>
  );
}
