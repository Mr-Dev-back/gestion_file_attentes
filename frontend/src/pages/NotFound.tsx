import { useNavigate } from 'react-router-dom';
import { Button } from '../components/atoms/ui/button';
import { Home, ArrowLeft, SearchX, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../components/molecules/ui/card';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
            {/* Design System Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" style={{ animationDelay: '1s' }} />
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none" />

            {/* Main Content Card */}
            <Card className="max-w-md w-full border-white/50 bg-white/60 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden animate-scale-in">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-50"></div>

                <CardContent className="p-8 text-center space-y-8">
                    {/* Icon Container */}
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-danger/10 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative h-24 w-24 bg-danger/10 rounded-full flex items-center justify-center mx-auto text-danger shadow-inner">
                            <SearchX className="h-12 w-12" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg animate-bounce-slow">
                            <AlertTriangle className="h-6 w-6 text-warning" />
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="space-y-2">
                        <h1 className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary drop-shadow-sm">
                            404
                        </h1>
                        <h2 className="text-2xl font-bold text-text-main">Page Introuvable</h2>
                        <p className="text-text-muted leading-relaxed">
                            Oups ! La page que vous recherchez semble avoir été déplacée ou n'existe pas.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outline"
                            size="lg"
                            className="flex-1 rounded-xl group hover:bg-surface"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Retour
                        </Button>
                        <Button
                            onClick={() => navigate('/')}
                            size="lg"
                            className="flex-1 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 group transition-all"
                        >
                            <Home className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                            Accueil
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Footer Branding */}
            <div className="absolute bottom-8 text-center">
                <p className="text-xs font-bold text-text-muted/50 tracking-widest uppercase">
                    GFA SIBM • Système de Gestion
                </p>
            </div>
        </div>
    );
}
