import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, ChevronLeft, Menu, Loader2, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Button } from '../../atoms/ui/button';
import { useAuthStore } from '../../../stores/useAuthStore';
import { getMenuItems, type QuaiMenuData } from '../../../utils/menuConfig';
import { api } from '../../../services/api';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface QuaiApiResponse {
  quaiId: string;
  label: string;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const [quais, setQuais] = useState<QuaiMenuData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchActiveQuais = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<QuaiApiResponse[]>('/quais/active');
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

  const menuItems = getMenuItems(user, quais);

  if (!user) return null;

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      className={cn(
        'fixed left-0 top-0 z-50 h-screen flex flex-col bg-white border-r border-slate-200/60 shadow-2xl shadow-slate-200/50 transition-colors duration-300',
      )}
    >
      {/* Header : Logo & Toggle */}
      <div className="flex h-20 items-center justify-between px-5 border-b border-slate-50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-md border border-slate-100 shrink-0 p-2">
            <img src="/sibm.png" alt="Logo SIBM" className="h-full w-full object-contain" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col"
              >
                <span className="text-lg font-black text-slate-800 tracking-tighter leading-none">SIBM</span>
                <span className="text-[10px] font-bold text-[#008F39] uppercase tracking-[0.2em] mt-0.5">GesParc</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary transition-all active:scale-90"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
            <ChevronLeft size={18} />
          </motion.div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
          </div>
        ) : (
          menuItems.map((item, index) => {
            const isGroup = 'items' in item;
            
            if (isGroup) {
              return (
                <div key={`group-${index}`} className="pt-2">
                  {!collapsed ? (
                    <div className="px-3 mb-2 text-[10px] font-black tracking-[0.15em] uppercase text-slate-400 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#008F39]/40" />
                       {item.title}
                    </div>
                  ) : (
                    <div className="h-px bg-slate-100 my-4 mx-3" />
                  )}
                  
                  <div className="space-y-1">
                    {item.items.map((subItem) => (
                      <SidebarLink 
                        key={subItem.path} 
                        to={subItem.path} 
                        icon={subItem.icon} 
                        label={subItem.label} 
                        collapsed={collapsed} 
                      />
                    ))}
                  </div>
                </div>
              );
            } else {
              return (
                <SidebarLink 
                  key={item.path} 
                  to={item.path} 
                  icon={item.icon} 
                  label={item.label} 
                  collapsed={collapsed} 
                />
              );
            }
          })
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-50">
        <button
          onClick={logout}
          className={cn(
            'group w-full h-11 flex items-center text-rose-500 hover:bg-rose-50/50 rounded-xl font-bold transition-all relative overflow-hidden active:scale-x-95',
            collapsed ? 'justify-center' : 'px-3'
          )}
        >
          <LogOut size={18} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="ml-3 text-xs uppercase tracking-widest"
              >
                Quitter
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}

function SidebarLink({ to, icon: Icon, label, collapsed }: { to: string, icon: any, label: string, collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center rounded-xl transition-all duration-300 relative group overflow-hidden h-11',
          collapsed ? 'justify-center mx-1' : 'px-3 mx-1',
          isActive
            ? 'bg-[#008F39] text-white shadow-lg shadow-[#008F39]/40 font-semibold'
            : 'text-slate-500 hover:bg-[#008F39]/5 hover:text-[#008F39]'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-5 w-5 shrink-0 transition-all duration-300', isActive ? 'scale-110 text-white' : 'group-hover:scale-110 group-hover:text-[#008F39]')} />
          
          <AnimatePresence>
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="ml-3 text-xs font-black truncate"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
          
          {isActive && (
            <motion.div 
              layoutId="active-indicator"
              className="absolute left-0 w-1 h-3/5 bg-white/20 rounded-r-full" 
            />
          )}

          {collapsed && (
             <div className="absolute left-[85px] px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {label}
             </div>
          )}
        </>
      )}
    </NavLink>
  );
}
