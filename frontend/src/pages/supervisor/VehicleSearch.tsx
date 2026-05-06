import { useState } from 'react';
import { AlertCircle, Search, Ticket, MapPinned, Truck, History, ArrowRight } from 'lucide-react';
import { trackingApi, type VehicleTrackingResult } from '../../services/trackingApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/molecules/ui/card';
import { Button } from '../../components/atoms/ui/button';
import { Input } from '../../components/atoms/ui/input';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

export default function VehicleSearch() {
  const [plateNumber, setPlateNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VehicleTrackingResult | null>(null);

  const onSearch = async () => {
    const plate = plateNumber.trim().toUpperCase();
    if (!plate) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await trackingApi.searchVehicle(plate);
      setResult(res);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) setError('Aucun ticket actif trouvé pour ce matricule.');
      else if (status === 403) setError('Accès refusé (rôle requis).');
      else setError('Erreur lors de la recherche. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-800 text-white rounded-3xl shadow-xl">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Recherche Véhicule</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Localisation temps réel sur site</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <Link to="/supervisor/workflow-view">
             <Button variant="outline" className="rounded-2xl border-slate-200 font-black uppercase tracking-widest text-[10px] h-12 px-6">
                <History className="w-4 h-4 mr-2" />
                Historique Complet
             </Button>
           </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <Card className="rounded-[2.5rem] border-white/40 bg-white/60 backdrop-blur-xl shadow-2xl shadow-slate-200/50 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              <div className="relative flex-1 group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 bg-slate-50 rounded-xl group-focus-within:bg-blue-50 transition-colors">
                  <Truck className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500" />
                </div>
                <Input
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="SAISISSEZ LE MATRICULE (EX: AB-123-CD)"
                  className="rounded-2xl h-16 pl-16 pr-6 font-black uppercase tracking-widest text-lg border-slate-100 bg-white/80 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSearch();
                  }}
                />
              </div>
              <Button 
                className="rounded-2xl font-black h-16 px-10 text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 bg-primary hover:scale-[1.02] active:scale-95 transition-all" 
                onClick={onSearch} 
                disabled={loading || !plateNumber.trim()}
              >
                {loading ? <Search className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5 mr-2" />}
                Rechercher
              </Button>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-center font-bold flex items-center justify-center gap-2 animate-in zoom-in-95 duration-200">
                <AlertCircle className="h-5 w-5" /> {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Card className="rounded-[2.5rem] border-white/40 bg-white/80 backdrop-blur-xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all">
            <CardHeader className="bg-slate-50/50 border-b border-border/10 p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Ticket className="h-4 w-4" />
                </div>
                Informations du Ticket Actif
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: 'Matricule', value: result.plateNumber, color: 'text-slate-900' },
                   { label: 'N° Ticket', value: `#${result.ticketNumber}`, color: 'text-blue-600' },
                   { label: 'Étape Actuelle', value: result.currentStep, color: 'text-slate-900' },
                   { label: 'Dernière MAJ', value: new Date(result.updatedAt).toLocaleTimeString(), color: 'text-slate-500' }
                 ].map((item, idx) => (
                   <div key={idx} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                     <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{item.label}</div>
                     <div className={cn("font-black text-lg tracking-tight", item.color)}>{item.value}</div>
                   </div>
                 ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-white/40 bg-slate-900 text-white shadow-xl overflow-hidden hover:scale-[1.01] transition-transform">
            <CardHeader className="bg-white/5 border-b border-white/10 p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                <div className="p-2 bg-white/10 text-white rounded-lg">
                  <MapPinned className="h-4 w-4" />
                </div>
                Actions de Pilotage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col justify-between h-full">
              <p className="text-slate-400 font-medium leading-relaxed mb-6">
                Le véhicule est actuellement immobilisé à l&apos;étape <span className="text-white font-bold">{result.currentStep}</span>. 
                Vous pouvez intervenir directement sur son flux depuis la console de régulation.
              </p>
              
              <Link to="/queue" className="group">
                <Button className="w-full h-16 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest text-xs hover:bg-slate-100 shadow-xl shadow-black/20 flex items-center justify-center gap-3">
                  Ouvrir la file d&apos;attente
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

