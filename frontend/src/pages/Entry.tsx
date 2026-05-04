import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useEntryForm } from '../hooks/useEntryForm';
import { EntryHeader } from '../components/entry/EntryHeader';
import { EntryHomeView } from '../components/entry/EntryHomeView';
import { EntryFormView } from '../components/entry/EntryFormView';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';

export default function Entry() {
    const { kioskId } = useParams();
    const [viewMode, setViewMode] = useState<'HOME' | 'ENTRY'>('HOME');
    const [kioskConfig, setKioskConfig] = useState<any>(null);
    const [isLoadingKiosk, setIsLoadingKiosk] = useState(!!kioskId);
    
    const entryFormState = useEntryForm();

    // Fetch Kiosk Config if ID is provided
    useEffect(() => {
        if (!kioskId) return;

        const fetchKiosk = async () => {
            try {
                const { data } = await api.get(`/kiosks/public/${kioskId}`);
                setKioskConfig(data);
                // Pre-select site if kiosk has one
                if (data.siteId) {
                    entryFormState.setFormData(prev => ({ ...prev, siteId: data.siteId }));
                }
            } catch (error) {
                console.error("Erreur chargement borne:", error);
            } finally {
                setIsLoadingKiosk(false);
            }
        };

        fetchKiosk();
    }, [kioskId]);

    if (isLoadingKiosk) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-slate-500 font-bold animate-pulse">Initialisation de la borne...</p>
                </div>
            </div>
        );
    }

    const themeColor = kioskConfig?.config?.primaryColor || '#3B82F6';
    const welcomeMsg = kioskConfig?.config?.welcomeMessage || 'Bienvenue chez SIBM';

    const mainStyle = {
        '--primary': themeColor,
    } as React.CSSProperties;

    if (viewMode === 'HOME') {
        return (
            <div className="min-h-screen bg-background relative overflow-hidden flex flex-col" style={mainStyle}>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" style={{ animationDelay: '1s' }} />

                <EntryHeader viewMode={viewMode} onGoHome={() => setViewMode('HOME')} />
                
                <EntryHomeView 
                    welcomeMessage={welcomeMsg}
                    showWeather={kioskConfig?.config?.showWeather}
                    queuedTrucks={entryFormState.tickets.filter(t => t.status === 'EN_ATTENTE')} 
                    onStartEntry={() => setViewMode('ENTRY')} 
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-10" style={mainStyle}>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" style={{ animationDelay: '1s' }} />

            <EntryHeader viewMode={viewMode} onGoHome={() => setViewMode('HOME')} />
            
            <EntryFormView 
                {...entryFormState}
                onReset={entryFormState.handleReset}
                onValidateOrder={entryFormState.handleValidateOrder}
                onSubmit={entryFormState.handleSubmit}
                onGoHome={() => setViewMode('HOME')}
                hasPrinter={kioskConfig?.capabilities?.hasPrinter}
            />

        </div>
    );
}

