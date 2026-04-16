import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User as UserIcon, 
  Activity, 
  Eye, 
  Clock, 
  Download,
  AlertCircle,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { auditApi, type AuditLogEntry, type AuditFilters } from '../../services/auditApi';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '../atoms/ui/skeleton';

import { DataTable } from '../molecules/DataTable/DataTable';
import { Badge } from '../atoms/ui/badge';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({
    page: 1,
    limit: 10,
    search: '',
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [filters.page, filters.limit, filters.userId, filters.action, filters.resourceType]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await auditApi.getLogs(filters);
      setLogs(data.logs);
      setTotalPages(data.pages);
      setTotalLogs(data.total);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('SUCCESS') || action === 'TICKET_FINISH') {
      return 'success'; // Vert SIBM
    }
    if (action.includes('UPDATE') || action.includes('CALL') || action.includes('START') || action === 'UNLOCK_USER') {
      return 'warning'; // Jaune (Attention)
    }
    if (action.includes('DELETE') || action.includes('FAILED') || action.includes('REVOKE')) {
      return 'danger'; // Rouge SIBM
    }
    return 'secondary';
  };

  const formatJSON = (json: any) => {
    if (!json) return 'N/A';
    return JSON.stringify(json, null, 2);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const columns = [
    {
      header: 'Statut',
      width: '60px',
      cell: (log: AuditLogEntry) => (
        <div className={cn(
          "w-3 h-3 rounded-full shadow-sm",
          getActionColor(log.action) === 'success' ? "bg-primary" : 
          getActionColor(log.action) === 'warning' ? "bg-amber-500" :
          getActionColor(log.action) === 'danger' ? "bg-danger" : "bg-slate-400"
        )} title={log.action} />
      )
    },
    {
      header: 'Horodatage',
      cell: (log: AuditLogEntry) => (
        <span className="font-medium text-slate-600">
          {format(new Date(log.occurredAt), 'dd MMM HH:mm:ss', { locale: fr })}
        </span>
      )
    },
    {
      header: 'Utilisateur',
      cell: (log: AuditLogEntry) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">
            {log.user?.username?.substring(0, 2).toUpperCase() || 'SY'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700 leading-tight">{log.user?.username || 'Système'}</span>
            <span className="text-[10px] text-slate-400 font-medium">{log.ipAddress}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Action',
      cell: (log: AuditLogEntry) => (
        <Badge variant={getActionColor(log.action) as any} className="text-[9px] font-black uppercase tracking-tighter">
          {log.action.replace(/_/g, ' ')}
        </Badge>
      )
    },
    {
      header: 'Ressource',
      cell: (log: AuditLogEntry) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700">{log.resourceType || '-'}</span>
          <span className="text-[10px] font-mono text-slate-400">{log.resourceId?.substring(0, 8) || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Détails',
      className: 'text-right',
      cell: (log: AuditLogEntry) => (
        <button 
          onClick={() => setSelectedLog(log)}
          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
        >
          <Eye className="w-5 h-5" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Search and Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/5">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Boîte Noire</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{totalLogs} événements enregistrés</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Rechercher une action, une ressource..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </form>
      </div>

      <DataTable 
        columns={columns}
        data={logs}
        isLoading={loading}
        totalItems={totalLogs}
        currentPage={filters.page || 1}
        pageSize={filters.limit || 10}
        onPageChange={(page) => setFilters({ ...filters, page })}
        onPageSizeChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
        emptyMessage="Aucun log d'audit pour cette période"
        showCompactToggle={true}
      />

      {/* Detail Modal (Side Panel Style) */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm transition-all" onClick={() => setSelectedLog(null)}>
          <div 
            className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getActionColor(selectedLog.action)}`} />
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Détails de l'événement</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <ChevronRight className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Event Summary */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Horodatage
                  </span>
                  <p className="text-sm font-semibold text-slate-700 italic">
                    {format(new Date(selectedLog.occurredAt), "eeee dd MMMM yyyy 'à' HH:mm:ss", { locale: fr })}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <UserIcon className="w-3 h-3" /> Acteur
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    {selectedLog.user?.username || 'Système'} ({selectedLog.user?.email || '-'})
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-3 h-3" /> Navigation
                  </span>
                  <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">
                    {selectedLog.userAgent}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" /> Adresse IP
                  </span>
                  <p className="text-sm font-mono text-primary font-bold">{selectedLog.ipAddress}</p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Diff Viewer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded uppercase tracking-widest">Avant (Old)</span>
                  <div className="p-4 bg-slate-900 rounded-xl overflow-hidden shadow-inner">
                    <pre className="text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto">
                      {formatJSON(selectedLog.oldValues)}
                    </pre>
                  </div>
                </div>
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded uppercase tracking-widest">Après (New)</span>
                  <div className="p-4 bg-slate-900 rounded-xl overflow-hidden shadow-inner border-l-4 border-emerald-500">
                    <pre className="text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto">
                      {formatJSON(selectedLog.newValues)}
                    </pre>
                  </div>
                </div>
              </div>

              {selectedLog.action === 'TICKET_FINISH' && selectedLog.newValues?.formData && (
                <div className="mt-8">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-widest flex items-center gap-2 mb-4 w-fit">
                    <FileText className="w-3 h-3" /> Données du Formulaire
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedLog.newValues.formData).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-xs font-bold text-slate-500">{key}</span>
                        <span className="text-xs font-black text-slate-700">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-4">
              <button 
                className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                onClick={() => window.print()}
              >
                <Download className="w-4 h-4" /> Télécharger Rapport
              </button>
              <button 
                className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-all"
                onClick={() => setSelectedLog(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
