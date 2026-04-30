import { useNavigate } from 'react-router-dom';
import { Truck, Monitor, Clock } from 'lucide-react';
import { Button } from '../atoms/ui/button';
import { Badge } from '../atoms/ui/badge';
import type { Ticket } from '../../types/ticket';

interface EntryHomeViewProps {
    queuedTrucks: Ticket[];
    onStartEntry: () => void;
}

export function EntryHomeView({ queuedTrucks, onStartEntry }: EntryHomeViewProps) {
    const navigate = useNavigate();

    return (
        <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full flex flex-col justify-center">
            {/* Hero Section */}
            <div className="text-center mb-16 animate-slide-up space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-text-main tracking-tight mb-4">
                    Bienvenue sur <span className="text-primary relative inline-block">
                        GesParc
                        <span className="absolute bottom-1 left-0 w-full h-2 bg-primary/10 -z-10 rounded-full"></span>
                    </span>
                </h2>
                <p className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
                    Notre plateforme centralisée pour la gestion des files d'attente des camions.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20 animate-slide-up w-full" style={{ animationDelay: '0.1s' }}>
                {/* Entry Card */}
                <div
                    onClick={onStartEntry}
                    className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-sm border border-border/50 hover:shadow-2xl hover:border-primary/30 transition-all duration-500 cursor-pointer text-center"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="h-32 w-32 bg-primary/10 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary text-primary group-hover:text-white transition-all duration-500 shadow-inner">
                            <Truck className="h-14 w-14" />
                        </div>
                        <h3 className="text-3xl font-bold text-text-main mb-3">Nouvelle Entrée</h3>
                        <p className="text-text-muted mb-8 text-lg">Enregistrer un camion entrant et générer un ticket.</p>
                        <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                            Commencer l'enregistrement
                        </Button>
                    </div>
                </div>

                {/* TV Card */}
                <div
                    onClick={() => navigate('/tv')}
                    className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-sm border border-border/50 hover:shadow-2xl hover:border-secondary/30 transition-all duration-500 cursor-pointer text-center"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="h-32 w-32 bg-secondary/10 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-secondary text-secondary group-hover:text-white transition-all duration-500 shadow-inner">
                            <Monitor className="h-14 w-14" />
                        </div>
                        <h3 className="text-3xl font-bold text-text-main mb-3">Écran Public</h3>
                        <p className="text-text-muted mb-8 text-lg">Afficher la file d'attente sur l'écran de la salle.</p>
                        <Button size="lg" variant="secondary" className="rounded-full px-8 h-12 text-base shadow-lg group-hover:shadow-xl transition-all">
                            Lancer l'affichage
                        </Button>
                    </div>
                </div>
            </div>

            {/* Dashboard Summary */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 p-6 shadow-sm max-w-5xl mx-auto w-full animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold flex items-center gap-3 text-text-main">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Clock className="h-5 w-5" />
                        </div>
                        File d'attente en temps réel
                    </h4>
                    <Badge variant="outline" className="px-3 py-1 bg-white ml-auto border-primary/20 text-primary">
                        {queuedTrucks.length} Camions
                    </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {queuedTrucks.length === 0 ? (
                        <p className="col-span-full text-center py-6 text-text-muted italic bg-surface/50 rounded-lg border border-dashed">
                            Aucun camion en attente actuellement.
                        </p>
                    ) : (
                        queuedTrucks.slice(0, 8).map(t => (
                            <div key={t.ticketId} className="bg-white p-3 rounded-xl border border-border/50 flex items-center justify-between text-sm shadow-sm hover:shadow-md transition-shadow">
                                <span className="font-mono font-bold text-text-main">{t.licensePlate}</span>
                                <Badge variant="secondary" className="text-[10px] scale-90">{t.category?.prefix || 'N/A'}</Badge>
                            </div>
                        ))
                    )}
                    {queuedTrucks.length > 8 && (
                        <div className="flex items-center justify-center text-xs text-text-muted font-medium bg-secondary/5 rounded-xl border border-transparent">
                            + {queuedTrucks.length - 8} autres...
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
