import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ConfirmModal } from '../components/molecules/ui/modal';
import { useSmartQuaiLogic } from '../hooks/useSmartQuaiLogic';
import { SmartQuaiSidebar } from '../components/supervisor/smart-quai/SmartQuaiSidebar';
import { SmartQuaiCentralArea } from '../components/supervisor/smart-quai/SmartQuaiCentralArea';
import { SmartQuaiHistory } from '../components/supervisor/smart-quai/SmartQuaiHistory';
import { SmartQuaiErrorState } from '../components/supervisor/smart-quai/SmartQuaiErrorState';
import { SmartQuaiTransferModal } from '../components/supervisor/smart-quai/SmartQuaiTransferModal';
import { toast } from '../components/molecules/ui/toast';

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
          <span className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em]">Terminal de Gestion SIBM</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden font-sans">
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

      <SmartQuaiSidebar
        waitingTickets={waitingTickets}
        selectedTicket={selectedTicket}
        onSelectTicket={setSelectedTicket}
        isCalling={workflow.isCalling}
        onCallNext={actions.handleCallNext}
        onLogout={authStore.logout}
        queueName={authStore.user?.queue?.name}
        categoryId={config?.categoryId}
      />

      {/* 2: CENTRAL ZONE */}
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

      {/* 3: HISTORY */}
      <SmartQuaiHistory
        completedTickets={historyTickets}
        onOpenHistory={(id) => console.log('Open history', id)}
      />
    </div>
  );
}
