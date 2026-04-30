import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Home, User, Clock } from 'lucide-react';
import { Button } from '../atoms/ui/button';

interface EntryHeaderProps {
    viewMode: 'HOME' | 'ENTRY';
    onGoHome: () => void;
}

export function EntryHeader({ viewMode, onGoHome }: EntryHeaderProps) {
    const navigate = useNavigate();

    return (
        <div className="bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4 animate-slide-in-right">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md group-hover:blur-lg transition-all opacity-50"></div>
                        <img src="/sibm.png" alt="GesParc" className="relative h-12 w-auto rounded-xl border border-white/50 transition-transform group-hover:scale-105 object-contain bg-white/50" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">GesParc</h1>
                        <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase opacity-80">Gestion des files d'attentes</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-2 animate-fade-in bg-surface/50 px-4 py-1.5 rounded-full border border-border/50 backdrop-blur-sm">
                        <span className="text-xs font-bold text-text-main capitalize flex items-center gap-2">
                            <Clock className="h-3 w-3 text-primary" />
                            {format(new Date(), 'EEEE d MMMM', { locale: fr })}
                        </span>
                    </div>
                    {viewMode !== 'HOME' && (
                        <Button variant="ghost" size="sm" onClick={onGoHome} className="rounded-full hover:bg-primary/5 hover:text-primary transition-colors">
                            <Home className="h-4 w-4 mr-2" />Accueil
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="rounded-full hover:bg-primary/5 hover:text-primary transition-colors">
                        <User className="h-4 w-4 mr-2" />Connexion
                    </Button>
                </div>
            </div>
        </div>
    );
}
