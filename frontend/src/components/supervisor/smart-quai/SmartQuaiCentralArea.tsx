import { useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Truck, ArrowLeftRight, PlayCircle, Phone, PauseCircle, Volume2, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/atoms/ui/button';
import { Input } from '../../../components/atoms/ui/input';
import { Timer } from '../../../components/atoms/ui/Timer';
import { cn } from '../../../lib/utils';
import type { Ticket, FormFieldConfig } from '../../../types/ticket';
import type { QuaiConfig } from '../../../hooks/useSmartQuaiLogic';

interface SmartQuaiCentralAreaProps {
  centralView: 'empty' | 'preview' | 'calling' | 'processing';
  activeTicket: Ticket | null;
  selectedTicket: Ticket | null;
  callingTicket: Ticket | null;
  config: QuaiConfig | null;
  isCalling: boolean;
  isIsolating: boolean;
  isRecalling: boolean;
  isProcessing: boolean;
  isCompleting: boolean;
  onCallTicket: (ticketId: string) => void;
  onIsolateTicket: (ticketId: string) => void;
  onRecallTicket: (ticketId: string) => void;
  onProcessTicket: (ticketId: string) => void;
  onCompleteStep: (data: any) => void;
  onOpenTransfer: () => void;
}

export function SmartQuaiCentralArea({
  centralView,
  activeTicket,
  selectedTicket,
  callingTicket,
  config,
  isCalling,
  isIsolating,
  isRecalling,
  isProcessing,
  isCompleting,
  onCallTicket,
  onIsolateTicket,
  onRecallTicket,
  onProcessTicket,
  onCompleteStep,
  onOpenTransfer
}: SmartQuaiCentralAreaProps) {

  // Schéma de validation dynamique
  const dynamicSchema = useMemo(() => {
    if (!config?.formConfig) return z.object({});
    const shape: Record<string, z.ZodTypeAny> = {};
    config.formConfig.forEach((field) => {
      const base: z.ZodTypeAny = field.type === 'number' ? z.coerce.number() : z.string();
      shape[field.name] = field.required ? base : base.optional().nullable();
    });
    return z.object(shape);
  }, [config]);

  const defaultValues = useMemo(() => {
    const defaults: Record<string, any> = {};
    config?.formConfig.forEach(f => { defaults[f.name] = f.defaultValue ?? ''; });
    return defaults;
  }, [config]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<Record<string, any>>({
    resolver: zodResolver(dynamicSchema) as unknown as ReturnType<typeof zodResolver>,
    defaultValues
  });

  useEffect(() => {
    if (config?.formConfig) {
      reset(defaultValues);
    }
  }, [config?.formConfig, reset, defaultValues]);

  return (
    <main className="flex-1 flex flex-col bg-white overflow-hidden">
      <AnimatePresence mode="wait">

        {/* EMPTY STATE */}
        {centralView === 'empty' && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl mb-10 border border-slate-100">
                <Truck className="h-24 w-24 text-primary animate-bounce-slow" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-[0.4em]">Terminal Prêt</h1>
              <div className="h-1 w-12 bg-primary rounded-full mt-6 mb-6" />
              <p className="text-xs text-slate-400 font-black uppercase tracking-[0.3em]">Sélectionnez un véhicule dans la file</p>
            </motion.div>
          </motion.div>
        )}

        {/* PREVIEW STATE */}
        {centralView === 'preview' && selectedTicket && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-8"
          >
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white p-8 rounded-3xl shadow-2xl flex flex-col justify-center min-h-[20vh] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Truck size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[9px] font-black uppercase tracking-[0.3em] border border-white/10">
                    {config?.label || 'Poste de travail'}
                  </span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none drop-shadow-2xl">
                  {selectedTicket.licensePlate}
                </h1>
                {selectedTicket.isTransferred && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg backdrop-blur-sm">
                    <ArrowLeftRight size={12} className="text-blue-300" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-200">Multi-Chargement / Transféré</span>
                  </div>
                )}
                <div className="mt-6 flex gap-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">N° Ticket</p>
                    <p className="text-xl font-black text-primary-foreground drop-shadow-md">#{selectedTicket.ticketNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Heure d'Arrivée</p>
                    <p className="text-xl font-black">{new Date(selectedTicket.arrivedAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-full max-w-4xl space-y-12">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Chauffeur</p>
                    <p className="text-xl font-black text-slate-900 uppercase">{(selectedTicket as any).driverName || '---'}</p>
                  </div>
                  <div className="space-y-1 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Société</p>
                    <p className="text-xl font-black text-slate-900 uppercase">{(selectedTicket as any).companyName || '---'}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  {selectedTicket.status === 'ISOLE' ? (
                    <Button
                      onClick={() => onIsolateTicket(selectedTicket.ticketId)}
                      disabled={isIsolating}
                      variant="outline"
                      className="flex-1 h-14 text-xl font-black uppercase tracking-widest gap-3 rounded-2xl border-danger/20 text-danger hover:bg-danger/5 shadow-lg active:scale-95 transition-all"
                    >
                      {isIsolating ? <Loader2 className="animate-spin h-6 w-6" /> : <><PlayCircle className="h-6 w-6" /> Reprendre</>}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => onCallTicket(selectedTicket.ticketId)}
                      disabled={isCalling}
                      className="flex-1 h-16 text-xl font-black uppercase tracking-widest gap-4 rounded-2xl shadow-xl bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                    >
                      {isCalling ? (
                        <>
                          <Loader2 className="animate-spin h-6 w-6" />
                          <span>Appel...</span>
                        </>
                      ) : (
                        <><Phone className="h-6 w-6 group-hover:animate-bounce" /> Appeler</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CALLING STATE */}
        {centralView === 'calling' && callingTicket && (
          <motion.div
            key="calling"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-8"
          >
            <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-orange-500 text-white p-8 rounded-3xl shadow-2xl flex flex-col justify-center min-h-[20vh] relative overflow-hidden">
              <motion.div
                initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute -top-24 -right-24 h-64 w-64 bg-white/10 blur-[80px] rounded-full"
              />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="flex items-center gap-3 mb-4 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                  <Phone className="h-4 w-4 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-[0.4em]">Appel en cours...</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none drop-shadow-2xl">
                  {callingTicket.licensePlate}
                </h1>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-10">
              <div className="flex items-center gap-4 text-slate-400 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs font-black uppercase tracking-[0.5em]">En attente de démarrage saisie</span>
              </div>
              <div className="w-full max-w-5xl flex gap-4">
                <Button
                  onClick={() => onIsolateTicket(callingTicket.ticketId)}
                  disabled={isIsolating}
                  variant="outline"
                  className="h-14 px-8 border-2 border-danger/20 text-danger font-black uppercase tracking-widest hover:bg-danger/5 rounded-2xl shadow-lg active:scale-95 transition-all"
                >
                  {isIsolating ? <Loader2 className="animate-spin" /> : <><PauseCircle className="h-6 w-6 mr-2" /> Isoler</>}
                </Button>

                <Button
                  onClick={() => onRecallTicket(callingTicket.ticketId)}
                  disabled={isRecalling}
                  variant="outline"
                  className="flex-1 h-14 text-xl font-black uppercase tracking-widest gap-3 rounded-2xl border-2 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {isRecalling ? <Loader2 className="animate-spin h-6 w-6" /> : <><Volume2 className="h-6 w-6" /> Rappeler</>}
                </Button>

                <Button
                  onClick={() => onProcessTicket(callingTicket.ticketId)}
                  disabled={isProcessing}
                  className="flex-1 h-14 text-xl font-black uppercase tracking-widest gap-4 rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary"
                >
                  {isProcessing ? <Loader2 className="animate-spin h-6 w-6" /> : <><PlayCircle className="h-6 w-6 text-white shadow-sm" /> Prise en charge</>}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* PROCESSING STATE */}
        {centralView === 'processing' && activeTicket && (
          <motion.div
            key="active"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex items-center justify-between min-h-[120px] border-b-2 border-primary">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="bg-primary text-[9px] px-2 py-0.5 font-black tracking-widest uppercase rounded-full shadow-lg shadow-primary/20">Traitement</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <ChevronRight size={12} className="text-primary" />
                    {(activeTicket as any).currentStep?.name || 'Saisie'}
                  </span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none drop-shadow-xl">
                  {activeTicket.licensePlate}
                </h1>
                {activeTicket.isTransferred && (
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Multi-Chargement</span>
                )}
              </div>

              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                  <span className="text-[9px] font-black uppercase tracking-widest">Temps</span>
                </div>
                {activeTicket.startedAt && (
                  <Timer startedAt={activeTicket.startedAt} className="text-3xl font-black font-mono leading-none text-primary-foreground tabular-nums drop-shadow-md" />
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-background p-10">
              <div className="max-w-3xl mx-auto space-y-12">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-6 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
                      Données d'Opération
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onCompleteStep)} className="space-y-10 pb-20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {config?.formConfig.map((field) => (
                      <div key={field.name} className={cn("space-y-3", config?.formConfig.length === 1 && "md:col-span-2")}>
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                          {field.label} {field.required && <span className="text-danger font-black">*</span>}
                        </label>
                        <Controller
                          name={field.name}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <div className="relative group">
                              {field.type === 'select' ? (
                                <select
                                  className="w-full h-16 px-6 bg-white border-2 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all text-xl font-black uppercase shadow-sm group-hover:border-slate-300"
                                  value={value || ''} onChange={onChange}
                                >
                                  <option value="">-- CHOISIR --</option>
                                  {field.options?.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
                                </select>
                              ) : (
                                <Input
                                  type={field.type} value={value || ''} onChange={onChange}
                                  placeholder={field.placeholder || field.label.toUpperCase()}
                                  className="h-16 bg-white border-2 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-xl font-black uppercase px-6 shadow-sm group-hover:border-slate-300 transition-all"
                                />
                              )}
                              {errors[field.name] && <span className="text-xs text-danger font-black uppercase mt-2 ml-2 block tracking-widest animate-in fade-in slide-in-from-top-1">{errors[field.name]?.message as string}</span>}
                            </div>
                          )}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 flex gap-4">
                    <Button
                      type="submit"
                      className="flex-1 h-16 text-xl font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl bg-primary hover:scale-[1.01] active:scale-[0.99] transition-all group overflow-hidden relative border-t border-white/10"
                      disabled={isCompleting}
                    >
                      <motion.div
                        className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity"
                      />
                      {isCompleting ? <Loader2 className="animate-spin h-6 w-6" /> : (
                        <div className="flex items-center justify-center gap-4">
                          Terminer
                          <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-500 text-white" />
                        </div>
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={onOpenTransfer}
                      variant="outline"
                      className="h-16 px-6 font-black uppercase tracking-widest gap-3 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-xl"
                    >
                      <ArrowLeftRight className="h-6 w-6" />
                      Transférer
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}
