import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/atoms/ui/button';
import { ShieldX, Home, ArrowLeft, Lock } from 'lucide-react'; // [AMÉLIORATION 3] Lock depuis lucide-react

export default function Unauthorized() {
    const navigate = useNavigate();

    // [AMÉLIORATION 4] Mise à jour du titre de page pour accessibilité et SEO
    useEffect(() => {
        const previousTitle = document.title;
        document.title = '403 — Accès Refusé';
        return () => { document.title = previousTitle; };
    }, []);

    // [AMÉLIORATION 1] Fallback si pas d'historique de navigation
    const handleBack = () => {
        if (window.history.length > 1) navigate(-1);
        else navigate('/');
    };

    return (
        // [AMÉLIORATION 5] role="main" pour l'accessibilité
        <div role="main" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
            <div className="max-w-2xl w-full text-center animate-fade-in">

                {/* Animated Illustration */}
                {/* [AMÉLIORATION 5] aria-hidden sur le bloc purement décoratif */}
                <div className="mb-8 animate-shake" aria-hidden="true">
                    <div className="relative inline-block">
                        {/* Shield Background Glow */}
                        <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse" />

                        {/* Main Shield Icon */}
                        <div className="relative bg-white rounded-3xl p-8 shadow-2xl border-4 border-red-100">
                            <ShieldX className="h-32 w-32 text-red-500 mx-auto" strokeWidth={1.5} />
                        </div>

                        {/* [AMÉLIORATION 3] Icône Lock via lucide-react — suppression du SVG inline */}
                        <div className="absolute -top-4 -right-4 bg-red-500 rounded-full p-3 shadow-lg animate-bounce">
                            <Lock className="h-8 w-8 text-white" />
                        </div>
                    </div>
                </div>

                {/* Error Code */}
                <div className="mb-4">
                    <span className="inline-block px-6 py-2 bg-red-100 text-red-600 rounded-full text-sm font-semibold tracking-wider">
                        ERREUR 403
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
                    Accès Refusé
                </h1>

                {/* Description */}
                <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                    Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                </p>

                {/* Additional Info */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8 max-w-md mx-auto">
                    <p className="text-sm text-gray-500 mb-2">
                        <span className="font-semibold text-gray-700">Besoin d'accès ?</span>
                    </p>
                    <p className="text-sm text-gray-600">
                        Contactez votre administrateur système pour obtenir les autorisations appropriées.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {/* [AMÉLIORATION 1] handleBack avec fallback vers '/' */}
                    <Button
                        onClick={handleBack}
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto group"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        Retour
                    </Button>
                    <Button
                        onClick={() => navigate('/')}
                        size="lg"
                        className="w-full sm:w-auto group bg-primary hover:bg-primary/90"
                    >
                        <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                        Aller à l'accueil
                    </Button>
                </div>
            </div>

            {/* [AMÉLIORATION 2] Note : à migrer vers index.css ou tailwind.config.js → theme.extend.animation */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-shake { animation: shake 0.6s ease-in-out; }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
            `}</style>
        </div>
    );
}