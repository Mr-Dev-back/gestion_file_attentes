import React, { useState } from 'react';
import { Search, Filter, Download, Calendar, Truck, MapPin, History, FileText, Loader2, Clock } from 'lucide-react';
import { Card } from '../components/molecules/ui/card';
import { Button } from '../components/atoms/ui/button';
import type { TicketArchive } from '../types/analytics';
import { generateDailyKPIReport } from '../utils/exportUtils';
import { ticketApi } from '../services/ticketApi';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export const ArchiveSearch: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    plaque: '',
    date: '',
    type: 'Tous les pôles',
    site: 'Tous les sites'
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets', 'archive', filters],
    queryFn: async () => {
      const apiFilters: any = { status: 'COMPLETE' };
      if (filters.plaque) apiFilters.licensePlate = filters.plaque;
      // Note: Real API might need different parameter names
      return await ticketApi.getTickets(apiFilters);
    }
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generateDailyKPIReport();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search Header */}
      <div className="bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-800 text-white rounded-3xl shadow-xl">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Archives & Historique</h2>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Recherche multi-critères consolidée</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={isExporting}
              className="rounded-2xl border-slate-200 font-black uppercase tracking-widest text-[10px] h-12 px-6 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Génération...' : 'Export PDF'}
            </Button>
            <Button className="rounded-2xl bg-primary shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-[10px] h-12 px-6">
              <Filter className="w-4 h-4 mr-2" />
              Appliquer Filtres
            </Button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Immatriculation</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Ex: CI-254-AB"
                value={filters.plaque}
                onChange={(e) => setFilters({ ...filters, plaque: e.target.value })}
                className="w-full bg-white border border-slate-100 h-12 pl-12 pr-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Période</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full bg-white border border-slate-100 h-12 pl-12 pr-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pôle Métier</label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select className="w-full bg-white border border-slate-100 h-12 pl-12 pr-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none">
                <option>Tous les pôles</option>
                <option>INFRA</option>
                <option>BATIMENT</option>
                <option>ELECTRICITE</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Site</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select className="w-full bg-white border border-slate-100 h-12 pl-12 pr-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none">
                <option>Tous les sites</option>
                <option>Abidjan</option>
                <option>San Pedro</option>
                <option>Bouaké</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <Card className="bg-white border-0 shadow-sm rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Ticket ID</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Véhicule</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Pôle</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Site</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Entrée</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Sortie</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Durée</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Action</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement des archives...</p>
                </td>
              </tr>
            ) : tickets?.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <History className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucun ticket archivé trouvé</p>
                </td>
              </tr>
            ) : (
              tickets?.map((ticket: any) => (
                <tr key={ticket.ticketId} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="font-black text-slate-800">#{ticket.ticketNumber || ticket.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                        <Truck className="w-4 h-4 text-slate-600" />
                      </div>
                      <span className="font-bold text-slate-700">{ticket.licensePlate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      ticket.category?.name?.includes('INFRA') ? 'bg-blue-100 text-blue-600' :
                      ticket.category?.name?.includes('BATIMENT') ? 'bg-orange-100 text-orange-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {ticket.category?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-medium text-slate-600">{ticket.site?.name || 'Site Inconnu'}</td>
                  <td className="px-6 py-5 text-sm text-slate-500">
                    {ticket.createdAt ? format(new Date(ticket.createdAt), 'dd/MM HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-500">
                    {ticket.completedAt ? format(new Date(ticket.completedAt), 'dd/MM HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {ticket.processingTime || 'N/A'}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase text-primary">
                      Détails
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {tickets?.length || 0} résultat(s) trouvé(s)
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl px-4 font-black uppercase text-[10px] tracking-widest border-slate-200 hover:bg-white transition-all"
              disabled={true} // Logic to be implemented if API supports pagination
            >
              Précédent
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl px-4 font-black uppercase text-[10px] tracking-widest border-slate-200 hover:bg-white transition-all"
              disabled={true} // Logic to be implemented if API supports pagination
            >
              Suivant
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ArchiveSearch;
