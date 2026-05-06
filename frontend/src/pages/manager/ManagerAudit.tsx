import { Shield, Download, FileSearch } from 'lucide-react';
import { AuditLogs } from '../../components/admin/AuditLogs';
import { Card, CardContent } from '../../components/molecules/ui/card';

export default function ManagerAudit() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl shadow-emerald-600/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Journaux d&apos;Audit</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Traçabilité complète des opérations</p>
            </div>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-3 text-slate-400">
           <FileSearch className="w-5 h-5 opacity-20" />
           <p className="text-xs font-medium max-w-[200px] leading-tight italic">
             Consultez les modifications, les accès et les actions critiques effectuées sur la plateforme.
           </p>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-sm overflow-hidden">
        <AuditLogs />
      </div>
    </div>
  );
}

