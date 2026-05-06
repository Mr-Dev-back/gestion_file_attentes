import { useMemo, useState } from 'react';
import { AlertTriangle, Filter, RefreshCcw } from 'lucide-react';
import { useSites, type Site } from '../../hooks/useSites';
import { useSupervisorQueues } from '../../hooks/useDashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/molecules/ui/card';
import { Badge } from '../../components/atoms/ui/badge';
import { Button } from '../../components/atoms/ui/button';
import { cn } from '../../lib/utils';

type AlertLevel = 'CRITIQUE' | 'URGENT' | 'NORMAL';

const getAlertLevel = (truckCount: number): AlertLevel => {
  if (truckCount >= 12) return 'CRITIQUE';
  if (truckCount >= 6) return 'URGENT';
  return 'NORMAL';
};

export default function ManagerAlerts() {
  const { sites, isLoading: sitesLoading } = useSites();
  const [siteId, setSiteId] = useState<string>('');
  const siteList = (sites || []) as Site[];

  const effectiveSiteId = useMemo(() => {
    if (siteId) return siteId;
    return siteList?.[0]?.siteId || '';
  }, [siteId, siteList]);

  const {
    data: queues = [],
    isLoading,
    refetch,
    isFetching,
  } = useSupervisorQueues(effectiveSiteId);

  const sortedQueues = useMemo(() => {
    const unique = Array.from(new Map(queues.map(q => [q.queueId, q])).values());
    return [...unique].sort((a, b) => (b.truckCount || 0) - (a.truckCount || 0));
  }, [queues]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            Alertes & goulots
          </h2>
          <p className="text-slate-500 font-medium">Détection simple basée sur la charge des files (tickets actifs).</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 px-3 py-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={effectiveSiteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="text-sm font-bold bg-transparent outline-none"
              disabled={sitesLoading}
            >
              {siteList.map((s: Site) => (
                <option key={s.siteId} value={s.siteId}>{s.name}</option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="rounded-[2rem]">
          <CardContent className="p-8 text-slate-500 font-bold">Chargement…</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedQueues.map((q) => {
            const level = getAlertLevel(q.truckCount || 0);
            const levelBadge =
              level === 'CRITIQUE'
                ? 'bg-red-100 text-red-700 border-red-200'
                : level === 'URGENT'
                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';

            return (
              <Card key={q.queueId} className="rounded-[2rem] border-border/30 overflow-hidden shadow-sm">
                <CardHeader className="bg-slate-50/60 border-b border-border/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">
                        {q.name}
                      </CardTitle>
                      <p className="text-xs text-slate-500 font-bold mt-1">
                        {q.siteName ? `Site : ${q.siteName}` : 'Site : N/A'}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] font-black uppercase tracking-widest', levelBadge)}>
                      {level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-black uppercase tracking-widest">Charge</div>
                    <div className="text-2xl font-black tracking-tight text-slate-800">{q.truckCount || 0}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-slate-500 font-black uppercase tracking-widest">Tickets (top 6)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(q.tickets || []).slice(0, 6).map((t) => (
                        <div
                          key={t.ticketId}
                          className="rounded-2xl bg-white border border-slate-200 p-3 flex items-center justify-between"
                        >
                          <div className="min-w-0">
                            <div className="font-black text-slate-800 truncate">#{t.ticketNumber}</div>
                            <div className="text-[10px] text-slate-500 font-bold truncate">
                              {t.vehicleInfo?.licensePlate || 'Sans immatriculation'}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">
                            {t.priority}
                          </Badge>
                        </div>
                      ))}
                      {(q.tickets || []).length === 0 && (
                        <div className="text-sm text-slate-400 font-bold">Aucun ticket actif.</div>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium">
                    Dernière mise à jour : {new Date().toLocaleTimeString()}
                    {isFetching ? ' (refresh…) ' : ''}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {sortedQueues.length === 0 && (
            <Card className="rounded-[2rem] lg:col-span-2">
              <CardContent className="p-8 text-slate-500 font-bold">
                Aucune file trouvée pour ce site.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
