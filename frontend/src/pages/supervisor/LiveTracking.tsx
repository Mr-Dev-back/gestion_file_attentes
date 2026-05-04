import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Car, MapPin, Clock, Ticket, AlertCircle, CheckCircle2, Truck, Check } from 'lucide-react';
import { searchVehicleByPlate } from '../../services/supervisorApi';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TrackingResult {
  plateNumber: string;
  ticketNumber: string;
  currentStep: string;
  updatedAt: string;
}

interface WorkflowStep {
  stepId: string;
  name: string;
  orderNumber: number;
}

export default function LiveTracking() {
  const { user } = useAuthStore();
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [stepsLoading, setStepsLoading] = useState(false);

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        setStepsLoading(true);
        const siteId = (user as any)?.siteId;
        if (!siteId) return;

        const siteRes = await api.get(`/sites/${siteId}`);
        const workflowId = siteRes.data?.workflowId;
        if (workflowId) {
          const stepsRes = await api.get<WorkflowStep[]>(`/workflows/${workflowId}/steps`);
          setWorkflowSteps(
            [...stepsRes.data].sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0))
          );
        }
      } catch (err) {
        console.error('Erreur chargement workflow:', err);
      } finally {
        setStepsLoading(false);
      }
    };
    fetchSteps();
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await searchVehicleByPlate(plate.trim());
      setResult(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Véhicule non trouvé ou aucun ticket actif sur le site.');
      } else {
        setError('Une erreur est survenue lors de la recherche.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = result ? workflowSteps.findIndex(s => s.name === result.currentStep) : -1;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-5 bg-blue-50/80 text-blue-600 rounded-[2rem] mb-6 ring-8 ring-blue-50/40 shadow-inner">
            <Search className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight uppercase mb-3 drop-shadow-sm">
            Localisation Véhicule
          </h2>
          <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto">
            Saisissez le matricule du véhicule pour connaître en temps réel sa position et son statut sur le site.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative group mb-12 max-w-2xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2rem] blur-md opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative flex items-center bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/60 overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all">
            <div className="pl-8 text-blue-500/70">
              <Car className="w-7 h-7" />
            </div>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="Ex: AB-123-CD"
              className="w-full py-6 px-5 text-2xl font-bold text-slate-800 placeholder-slate-300 outline-none uppercase bg-transparent tracking-widest"
            />
            <div className="pr-3 py-3">
              <button
                type="submit"
                disabled={loading || stepsLoading || !plate.trim()}
                className="h-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center gap-3"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-lg tracking-wide">Rechercher</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="max-w-2xl mx-auto bg-red-50/80 backdrop-blur-md border border-red-200/60 p-6 rounded-3xl flex items-start gap-5 text-red-600 shadow-lg shadow-red-500/5"
            >
              <div className="bg-red-100 p-3 rounded-2xl shrink-0">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <div className="pt-1">
                <h4 className="font-bold text-xl mb-1 text-red-800">Aucun résultat</h4>
                <p className="font-medium text-red-600/80 text-lg">{error}</p>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-emerald-500/10 border border-white/80 overflow-hidden"
            >
              <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-8 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                
                <div className="relative flex items-center justify-between z-10">
                  <div className="flex items-center gap-5">
                    <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md border border-white/30 shadow-inner">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <p className="text-emerald-100 font-bold text-sm tracking-widest uppercase mb-1 drop-shadow-md">Véhicule Localisé</p>
                      <h3 className="text-4xl font-black tracking-widest drop-shadow-md">{result.plateNumber}</h3>
                    </div>
                  </div>
                  <div className="bg-white/20 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg">
                    <span className="text-emerald-50 font-bold tracking-widest text-sm flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                      </span>
                      SUR SITE
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative border-b border-slate-100">
                <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>

                <div className="space-y-6">
                  <div className="group">
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2 group-hover:text-blue-500 transition-colors">
                      <Ticket className="w-5 h-5" /> N° de Ticket
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-2xl font-bold text-slate-600 tracking-wide">
                        {result.ticketNumber}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-[2rem] p-6 border border-slate-200/60 shadow-inner flex flex-col justify-center items-center text-center">
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Dernier mouvement
                  </p>
                  <p className="text-4xl font-black text-slate-800 mb-2 tracking-tight">
                    {format(new Date(result.updatedAt), 'HH:mm', { locale: fr })}
                  </p>
                  <p className="text-slate-500 font-semibold text-sm bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100">
                    {format(new Date(result.updatedAt), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>

              {/* Cartographie du Workflow */}
              <div className="p-8 bg-slate-50/50">
                <h4 className="text-slate-700 font-black uppercase tracking-widest text-sm mb-10 flex items-center justify-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  Cartographie du Parcours
                </h4>

                {workflowSteps.length > 0 ? (
                  <div className="relative max-w-3xl mx-auto px-6">
                    {/* Ligne de fond */}
                    <div className="absolute top-6 left-6 right-6 h-1.5 bg-slate-200 rounded-full z-0"></div>
                    
                    {/* Ligne de progression colorée */}
                    {currentStepIndex >= 0 && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStepIndex / (workflowSteps.length - 1)) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute top-6 left-6 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full z-0"
                      ></motion.div>
                    )}

                    <div className="relative z-10 flex justify-between">
                      {workflowSteps.map((step, idx) => {
                        const isActive = step.name === result.currentStep;
                        const isPast = idx < currentStepIndex;
                        const isFuture = idx > currentStepIndex;

                        return (
                          <div key={step.stepId} className="flex flex-col items-center w-24">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-700 bg-white ${
                              isActive 
                                ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-125' 
                                : isPast
                                  ? 'border-emerald-500 text-emerald-500'
                                  : 'border-slate-200 text-slate-300'
                            }`}>
                              {isActive ? (
                                <motion.div
                                  animate={{ y: [0, -3, 0] }}
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                  className="relative"
                                >
                                  <Truck className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                  </span>
                                </motion.div>
                              ) : isPast ? (
                                <Check className="w-5 h-5 font-bold" />
                              ) : (
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                              )}
                            </div>
                            
                            <div className={`mt-5 text-center transition-all duration-500 ${isActive ? 'scale-110' : ''}`}>
                              <p className={`text-[10px] font-black uppercase tracking-widest leading-tight ${
                                isActive 
                                  ? 'text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl shadow-sm' 
                                  : isPast
                                    ? 'text-slate-600'
                                    : 'text-slate-400'
                              }`}>
                                {step.name}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 text-sm italic py-4">
                    Chargement de la configuration du site...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
