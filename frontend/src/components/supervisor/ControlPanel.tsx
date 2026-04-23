import React from 'react';
import { Search, PauseCircle, PlayCircle, Filter, History } from 'lucide-react';
import { Button } from '../atoms/ui/button';

interface ControlPanelProps {
  onSearch: (query: string) => void;
  onToggleEntrées: (active: boolean) => void;
  entriesSuspended: boolean;
  onOpenHistory: () => void;
}

export function ControlPanel({ onSearch, onToggleEntrées, entriesSuspended, onOpenHistory }: ControlPanelProps) {
  return (
    <div className="bg-white/40 backdrop-blur-xl p-6 mb-8 rounded-[2rem] border border-white/60 shadow-xl shadow-black/5 flex flex-col xl:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4 w-full xl:w-auto">
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Rechercher une plaque..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-white/60 border border-slate-200 py-3 pl-12 pr-4 rounded-2xl font-bold tracking-tight text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-slate-400"
          />
        </div>
        <Button variant="outline" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 h-12 px-6 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest shrink-0">
          <Filter className="w-4 h-4 mr-2" />
          Filtres
        </Button>
      </div>

      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 w-full xl:w-auto">
        <Button 
          onClick={() => onToggleEntrées(!entriesSuspended)}
          className={`flex-1 md:flex-none h-14 px-6 font-black text-[10px] tracking-widest uppercase rounded-2xl transition-all shadow-lg active:scale-95 ${
            entriesSuspended 
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20' 
              : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
          }`}
        >
          {entriesSuspended ? (
            <><PlayCircle className="w-5 h-5 mr-2" /> Reprendre Entrées</>
          ) : (
            <><PauseCircle className="w-5 h-5 mr-2" /> Suspendre Entrées</>
          )}
        </Button>

        <Button 
          className="flex-1 md:flex-none h-14 px-6 bg-indigo-600 text-white hover:bg-indigo-700 font-black text-[10px] tracking-widest uppercase rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          Libérer File d'attente
        </Button>

        <Button 
          onClick={onOpenHistory}
          className="flex-1 md:flex-none h-14 px-6 bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all font-black text-[10px] tracking-widest rounded-2xl shadow-lg shadow-black/5 active:scale-95"
        >
          <History className="w-5 h-5 mr-2" />
          JOURNAL DES SORTIES
        </Button>
      </div>
    </div>
  );
}
