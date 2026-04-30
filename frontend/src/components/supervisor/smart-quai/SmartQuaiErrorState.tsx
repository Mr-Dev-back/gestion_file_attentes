import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../../atoms/ui/button';

export function SmartQuaiErrorState({ error, onRetry }: { error: { message: string, code?: number }, onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-6">
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-danger/10 flex flex-col items-center text-center max-w-md">
        <div className="w-20 h-20 bg-danger/10 rounded-3xl flex items-center justify-center mb-6">
          <AlertTriangle className="h-10 w-10 text-danger" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Erreur de Configuration</h2>
        <p className="text-slate-500 text-sm mb-8">{error.message}</p>
        <Button onClick={onRetry} className="w-full h-14 rounded-2xl gap-2 font-black uppercase tracking-widest">
          <RefreshCw className="h-5 w-5" /> Réessayer
        </Button>
        {error.code && (
          <span className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-widest">
            Code technique : {error.code}
          </span>
        )}
      </div>
    </div>
  );
}
