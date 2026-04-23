import React, { useEffect, useState } from 'react';
import {
  Search,
  User as UserIcon,
  Activity,
  Eye,
  Clock,
  Download,
  AlertCircle,
  FileText,
  Shield,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from '../molecules/ui/toast';
import { auditApi, type AuditFilters, type AuditLogEntry } from '../../services/auditApi';
import { DataTable } from '../molecules/DataTable/DataTable';
import { Badge } from '../atoms/ui/badge';
import { cn } from '../../lib/utils';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({
    page: 1,
    limit: 10,
    search: ''
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [exporting, setExporting] = useState(false);

  const pageSize = typeof filters.limit === 'number' ? filters.limit : 10;

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.search, filters.userId, filters.action, filters.resourceType]);

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
      return 'success';
    }
    if (action.includes('UPDATE') || action.includes('CALL') || action.includes('START') || action === 'UNLOCK_USER') {
      return 'warning';
    }
    if (action.includes('DELETE') || action.includes('FAILED') || action.includes('REVOKE')) {
      return 'danger';
    }
    return 'secondary';
  };

  const formatJSON = (json: unknown) => {
    if (!json) {
      return 'N/A';
    }
    return JSON.stringify(json, null, 2);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const data = await auditApi.getLogs({ ...filters, limit: 'all', page: 1 });
      const exportLogs = data.logs;

      const headers = ['ID', 'Date', 'Utilisateur', 'Email', 'Role', 'IP', 'Action', 'Ressource', 'ID Ressource', 'Anciennes Valeurs', 'Nouvelles Valeurs'];
      const rows = exportLogs.map((log) => [
        log.auditId,
        format(new Date(log.occurredAt), 'dd/MM/yyyy HH:mm:ss'),
        log.user?.username || 'Systeme',
        log.user?.email || '',
        '',
        log.ipAddress || '',
        log.action,
        log.resourceType || '',
        log.resourceId || '',
        log.oldValues ? JSON.stringify(log.oldValues).replace(/"/g, '""') : '',
        log.newValues ? JSON.stringify(log.newValues).replace(/"/g, '""') : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `GesParc_Audit_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Export CSV genere avec succes', 'success');
    } catch (error) {
      console.error('Erreur export CSV:', error);
      toast('Erreur lors de l exportation', 'error');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      header: 'Statut',
      width: '60px',
      cell: (log: AuditLogEntry) => (
        <div
          className={cn(
            'w-3 h-3 rounded-full shadow-sm',
            getActionColor(log.action) === 'success'
              ? 'bg-primary'
              : getActionColor(log.action) === 'warning'
                ? 'bg-amber-500'
                : getActionColor(log.action) === 'danger'
                  ? 'bg-danger'
                  : 'bg-slate-400'
          )}
          title={log.action}
        />
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
            <span className="text-sm font-bold text-slate-700 leading-tight">{log.user?.username || 'Systeme'}</span>
            <span className="text-[10px] text-slate-400 font-medium">{log.ipAddress}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Action',
      cell: (log: AuditLogEntry) => (
        <Badge variant={getActionColor(log.action) as never} className="text-[9px] font-black uppercase tracking-tighter">
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
      header: 'Details',
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/5">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Boite Noire</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{totalLogs} evenements enregistres</p>
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

        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="px-5 py-3 h-12 bg-[#008F39] hover:bg-[#00702d] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-[#008F39]/20 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Download className="w-4 h-4 text-white" />}
          Exporter CSV
        </button>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={loading}
        totalItems={totalLogs}
        currentPage={filters.page || 1}
        pageSize={pageSize}
        onPageChange={(page) => setFilters({ ...filters, page })}
        onPageSizeChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
        emptyMessage="Aucun log d audit pour cette periode"
        showCompactToggle={true}
      />

      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm transition-all" onClick={() => setSelectedLog(null)}>
          <div
            className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getActionColor(selectedLog.action)}`} />
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Details de l evenement</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <ChevronRight className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Horodatage
                  </span>
                  <p className="text-sm font-semibold text-slate-700 italic">
                    {format(new Date(selectedLog.occurredAt), "eeee dd MMMM yyyy 'a' HH:mm:ss", { locale: fr })}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <UserIcon className="w-3 h-3" /> Acteur
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    {selectedLog.user?.username || 'Systeme'} ({selectedLog.user?.email || '-'})
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
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded uppercase tracking-widest">Apres (New)</span>
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
                    <FileText className="w-3 h-3" /> Donnees du Formulaire
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
                <Download className="w-4 h-4" /> Telecharger Rapport
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
