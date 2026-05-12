import { useParams } from 'react-router-dom';
import { Loader2, ListOrdered, Zap, History as HistoryIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ConfirmModal } from '../components/molecules/ui/modal';
import { useSmartQuaiLogic } from '../hooks/useSmartQuaiLogic';
import { useWindowSize } from '../hooks/useWindowSize';
import { SmartQuaiSidebar } from '../components/supervisor/smart-quai/SmartQuaiSidebar';
import { SmartQuaiCentralArea } from '../components/supervisor/smart-quai/SmartQuaiCentralArea';
import { SmartQuaiHistory } from '../components/supervisor/smart-quai/SmartQuaiHistory';
import { SmartQuaiErrorState } from '../components/supervisor/smart-quai/SmartQuaiErrorState';
import { SmartQuaiTransferModal } from '../components/supervisor/smart-quai/SmartQuaiTransferModal';
import { toast } from '../components/molecules/ui/toast';
import { cn } from '../lib/utils';
import type { Ticket } from '../types/ticket';

export default function SmartQuai() {
  const { quaiId: quaiIdFromUrl } = useParams<{ quaiId: string }>();
  
  const {
    quaiId,
    config,
    isLoadingConfig,
    configError,
    fetchQuaiConfig,
    selectedTicket,
    setSelectedTicket,
    pendingCallTicketId,
    isTransferModalOpen,
    setIsTransferModalOpen,
    waitingTickets,
    activeTicket,
    callingTicket,
    historyTickets,
    centralView,
    authStore,
    workflow,
    actions
  } = useSmartQuaiLogic(quaiIdFromUrl);
  
  const { isMobile } = useWindowSize();
  const [mobileActiveTab, setMobileActiveTab] = useState<'waiting' | 'active' | 'history'>('active');

  // Auto-switch to active tab when a ticket is selected on mobile
  const handleSelectTicket = (ticket: Ticket | null) => {
    setSelectedTicket(ticket);
    if (isMobile && ticket) {
      setMobileActiveTab('active');
    }
  };

  if (configError) {
    return <SmartQuaiErrorState error={configError} onRetry={fetchQuaiConfig} />;
  }

  if (workflow.isLoadingTickets || isLoadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-white gap-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-black uppercase tracking-[0.5em] text-slate-400 animate-pulse">Initialisation</span>
          <span className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em]">Terminal de Gestion GesParc</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-background overflow-hidden font-sans">
      <ConfirmModal
        isOpen={!!pendingCallTicketId}
        onClose={actions.handleCancelOverrideCall}
        onConfirm={actions.handleConfirmOverrideCall}
        title="Appel concurrent"
        message="Un véhicule est déjà en cours d'appel sur ce poste. Voulez-vous quand même appeler ce véhicule ?"
        confirmText="Appeler quand même"
        cancelText="Annuler"
        variant="warning"
      />

      {(activeTicket || callingTicket || selectedTicket) && (
        <SmartQuaiTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          ticket={(activeTicket || callingTicket || selectedTicket)!}
          currentQuaiId={quaiId}
          isTransferring={workflow.isTransferring}
          onTransfer={(data) => {
            workflow.transferTicket(
              { ticketId: (activeTicket || callingTicket || selectedTicket)!.ticketId, ...data },
              {
                onSuccess: () => {
                  setIsTransferModalOpen(false);
                  setSelectedTicket(null);
                }
              }
            );
          }}
        />
      )}

      {/* 1: WAITING LIST */}
      {(!isMobile || mobileActiveTab === 'waiting') && (
        <SmartQuaiSidebar
          waitingTickets={waitingTickets}
          selectedTicket={selectedTicket}
          onSelectTicket={handleSelectTicket}
          isCalling={workflow.isCalling}
          onCallNext={actions.handleCallNext}
          onLogout={authStore.logout}
          queueName={authStore.user?.queue?.name}
          categoryId={config?.categoryId}
        />
      )}

      {/* 2: CENTRAL ZONE */}
      {(!isMobile || mobileActiveTab === 'active') && (
        <SmartQuaiCentralArea
          centralView={centralView}
          activeTicket={activeTicket}
          selectedTicket={selectedTicket}
          callingTicket={callingTicket}
          config={config}
          isCalling={workflow.isCalling}
          isIsolating={workflow.isIsolating}
          isRecalling={workflow.isRecalling}
          isProcessing={workflow.isProcessing}
          isCompleting={workflow.isCompleting}
          onCallTicket={actions.handleCallTicket}
          onIsolateTicket={workflow.isolateTicket}
          onRecallTicket={workflow.recallTicket}
          onProcessTicket={actions.handleProcessTicket}
          onCompleteStep={(data) => {
            if (!activeTicket) return;
            workflow.completeStep(
              { ticketId: activeTicket.ticketId, formData: data, quaiId },
              {
                onSuccess: () => {
                  toast.success("Étape validée !");
                  setSelectedTicket(null);
                },
                onError: () => toast.error("Échec de la validation.")
              }
            );
          }}
          onOpenTransfer={() => setIsTransferModalOpen(true)}
        />
      )}

      {/* 3: HISTORY */}
      {(!isMobile || mobileActiveTab === 'history') && (
        <SmartQuaiHistory
          completedTickets={historyTickets}
          onOpenHistory={(id) => console.log('Open history', id)}
        />
      )}

      {/* MOBILE NAVIGATION BAR */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex items-center justify-around z-50 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
          <MobileNavButton 
            active={mobileActiveTab === 'waiting'} 
            onClick={() => setMobileActiveTab('waiting')}
            icon={ListOrdered}
            label="File"
            badge={waitingTickets.length}
          />
          <MobileNavButton 
            active={mobileActiveTab === 'active'} 
            onClick={() => setMobileActiveTab('active')}
            icon={Zap}
            label="Poste"
            highlight={!!activeTicket || !!callingTicket}
          />
          <MobileNavButton 
            active={mobileActiveTab === 'history'} 
            onClick={() => setMobileActiveTab('history')}
            icon={HistoryIcon}
            label="Historique"
          />
        </div>
      )}
    </div>
  );
}

function MobileNavButton({ active, onClick, icon: Icon, label, badge, highlight }: { 
  active: boolean, 
  onClick: () => void, 
  icon: LucideIcon, 
  label: string, 
  badge?: number,
  highlight?: boolean
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 min-w-[70px] relative transition-all duration-300",
        active ? "text-primary" : "text-slate-400"
      )}
    >
      <div className={cn(
        "p-2 rounded-2xl transition-all duration-300",
        active ? "bg-primary/10" : "bg-transparent",
        highlight && !active && "animate-pulse text-amber-500"
      )}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className={cn("text-[10px] font-black uppercase tracking-widest transition-all", active ? "opacity-100" : "opacity-60")}>
        {label}
      </span>
      
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-1 bg-primary text-white text-[8px] font-black h-4 min-w-[16px] flex items-center justify-center rounded-full px-1 border-2 border-white shadow-sm">
          {badge}
        </span>
      )}

      {active && (
        <motion.div 
          layoutId="active-tab"
          className="absolute -top-1 w-12 h-1 bg-primary rounded-full"
        />
      )}
    </button>
  );
}
