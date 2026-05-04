import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Loader2, CheckCircle2, Building2, Truck } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ticketApi } from '../../../services/ticketApi';
import { useCategories } from '../../../hooks/useCategories';
import { Button } from '../../atoms/ui/button';
import type { Ticket } from '../../../types/ticket';

interface SmartQuaiTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  currentQuaiId?: string;
  onTransfer: (data: { targetQuaiId?: string; targetCategoryId?: string }) => void;
  isTransferring: boolean;
}

export function SmartQuaiTransferModal({
  isOpen,
  onClose,
  ticket,
  currentQuaiId,
  onTransfer,
  isTransferring
}: SmartQuaiTransferModalProps) {
  const [targetQuaiId, setTargetQuaiId] = useState<string | undefined>(undefined);
  const [targetCategoryId, setTargetCategoryId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'QUAI' | 'CATEGORY'>('QUAI');

  const { data: availableQuais = [], isLoading: isLoadingQuais } = useQuery({
    queryKey: ['availableQuaisForStep', ticket.currentStepId],
    queryFn: () => ticketApi.getAvailableQuaisForStep(ticket.currentStepId!),
    enabled: isOpen && !!ticket.currentStepId
  });

  const { categories = [], isLoading: isLoadingCats } = useCategories();

  const filteredQuais = useMemo(() => 
    availableQuais.filter(q => q.quaiId !== currentQuaiId),
    [availableQuais, currentQuaiId]
  );

  const handleConfirm = () => {
    onTransfer({ targetQuaiId, targetCategoryId });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border-4 border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
              <ArrowLeftRight className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">Transfert de Flux</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                Ticket #{ticket.ticketNumber} • {ticket.licensePlate}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <span className="text-2xl font-light">×</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-slate-100/50 border-b border-slate-100 shrink-0">
          <button
            onClick={() => setActiveTab('QUAI')}
            className={cn(
              "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3",
              activeTab === 'QUAI' ? "bg-white text-primary shadow-md border border-slate-200" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Building2 size={16} /> Changer de Quai
          </button>
          <button
            onClick={() => setActiveTab('CATEGORY')}
            className={cn(
              "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3",
              activeTab === 'CATEGORY' ? "bg-white text-primary shadow-md border border-slate-200" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Truck size={16} /> Rectifier Catégorie
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {activeTab === 'QUAI' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Quais Disponibles pour cette étape</h3>
                {isLoadingQuais && <Loader2 className="animate-spin h-4 w-4 text-primary" />}
              </div>
              
              {filteredQuais.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {filteredQuais.map((q) => {
                    const isSelected = targetQuaiId === q.quaiId;
                    return (
                      <div
                        key={q.quaiId}
                        onClick={() => setTargetQuaiId(isSelected ? undefined : q.quaiId)}
                        className={cn(
                          "relative p-6 rounded-[1.5rem] border-4 transition-all cursor-pointer flex flex-col gap-2",
                          isSelected ? "bg-primary border-primary text-white shadow-xl scale-102" : "bg-white border-slate-100 hover:border-slate-200 text-slate-600"
                        )}
                      >
                        <span className="text-xl font-black uppercase tracking-tight">{q.label}</span>
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", isSelected ? "text-white/60" : "text-slate-400")}>
                          Identifiant: {q.quaiId}
                        </span>
                        {isSelected && <CheckCircle2 className="absolute top-4 right-4 h-6 w-6 text-white" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold uppercase text-xs">Aucun autre quai disponible pour cette étape.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'CATEGORY' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Nouvelle Catégorie de Flux</h3>
                {isLoadingCats && <Loader2 className="animate-spin h-4 w-4 text-primary" />}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {categories.map((c) => {
                  const isSelected = targetCategoryId === c.categoryId;
                  const isCurrent = ticket.categoryId === c.categoryId;
                  return (
                    <div
                      key={c.categoryId}
                      onClick={() => !isCurrent && setTargetCategoryId(isSelected ? undefined : c.categoryId)}
                      className={cn(
                        "relative p-6 rounded-[1.5rem] border-4 transition-all flex flex-col gap-2 shadow-sm",
                        isSelected ? "bg-primary border-primary text-white shadow-xl scale-102 cursor-pointer" : 
                        isCurrent ? "bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed" :
                        "bg-white border-slate-100 hover:border-slate-200 text-slate-600 cursor-pointer"
                      )}
                    >
                      <span className="text-xl font-black uppercase tracking-tight">{c.name}</span>
                      <span className={cn("text-[9px] font-black uppercase tracking-widest", isSelected ? "text-white/60" : "text-slate-400")}>
                        {isCurrent ? "ACTUELLE" : "SÉLECTIONNER"}
                      </span>
                      {isSelected && <CheckCircle2 className="absolute top-4 right-4 h-6 w-6 text-white" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-white border-t border-slate-100 flex gap-4 shrink-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-16 px-8 font-black uppercase tracking-widest rounded-2xl"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isTransferring || (!targetQuaiId && !targetCategoryId)}
            className="flex-1 h-16 text-xl font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl bg-primary"
          >
            {isTransferring ? <Loader2 className="animate-spin h-6 w-6" /> : "Confirmer le Transfert"}
          </Button>
        </div>
      </div>
    </div>
  );
}
