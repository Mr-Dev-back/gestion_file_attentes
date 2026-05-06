import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Bell, BellRing, AlertTriangle, Zap, Building2, Speaker, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { useQuery } from '@tanstack/react-query';
import { ticketApi } from '../services/ticketApi';
import { useAuthStore } from '../stores/useAuthStore';
import { useSearchParams } from 'react-router-dom';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { SocketTicketEventPayload } from '../types/ticket';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface DisplayTicket {
    ticketId: string;
    ticketNumber: string;
    priority: string;
    licensePlate?: string;
    destination?: string;
    status?: string;
    calledAt?: string;
    categoryName?: string;
}

interface DisplayData {
    called: DisplayTicket[];
    waiting: DisplayTicket[];
    isolated?: DisplayTicket[];
    siteName?: string;
    // [AMÉLIORATION 5] Messages du bandeau défilant fournis par l'API
    marqueeMessages?: string[];
}

interface AudioConfig {
    text: string;
    lang: string;
    repetitions: number;
}

interface TicketCallPayload extends SocketTicketEventPayload {
    isRecall?: boolean;
    audio?: Partial<AudioConfig> & { enabled?: boolean };
}

interface LastCalledTicket {
    number: string;
    destination: string;
    licensePlate?: string;
}

// ─────────────────────────────────────────────
// Hook : useAudio
// ─────────────────────────────────────────────
function useAudio() {
    const volumeRef = useRef(0.8);
    const isMutedRef = useRef(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    const [volume, setVolumeState] = useState(0.8);
    const [isMuted, setIsMutedState] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isAudioBlocked, setIsAudioBlocked] = useState(false);

    const setVolume = useCallback((v: number) => {
        volumeRef.current = v;
        setVolumeState(v);
    }, []);

    const setIsMuted = useCallback((m: boolean) => {
        isMutedRef.current = m;
        setIsMutedState(m);
    }, []);

    const enableAudio = useCallback(async () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }
            setIsAudioEnabled(true);
            setIsAudioBlocked(false);

            const oscillator = audioContextRef.current.createOscillator();
            const gain = audioContextRef.current.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
            gain.gain.setValueAtTime(0.0001, audioContextRef.current.currentTime);
            oscillator.connect(gain);
            gain.connect(audioContextRef.current.destination);
            oscillator.start();
            oscillator.stop(audioContextRef.current.currentTime + 0.1);
        } catch (e: any) {
            if (e.name !== 'NotAllowedError') {
                console.warn('AudioContext activation failed:', e);
            }
            setIsAudioBlocked(true);
        }
    }, []);

    const playNotificationSound = useCallback(async () => {
        if (isMutedRef.current) return;
        try {
            if (!audioContextRef.current || audioContextRef.current.state === 'suspended') {
                await enableAudio();
            }
            if (!audioContextRef.current || audioContextRef.current.state === 'suspended') return;

            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContextRef.current.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1100, audioContextRef.current.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.3 * volumeRef.current, audioContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.8);
            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);
            oscillator.start();
            oscillator.stop(audioContextRef.current.currentTime + 0.8);
        } catch (e: any) {
            if (e.name !== 'NotAllowedError') {
                console.warn('Audio notification failed:', e);
            }
        }
    }, [enableAudio]);

    const playAudioFromUrl = useCallback((url: string, signal: AbortSignal): Promise<void> => {
        return new Promise((resolve, reject) => {
            const audio = new Audio(url);
            audio.volume = volumeRef.current;

            const onAbort = () => {
                audio.pause();
                audio.src = '';
                reject(new DOMException('Aborted', 'AbortError'));
            };

            signal.addEventListener('abort', onAbort, { once: true });
            audio.onended = () => { signal.removeEventListener('abort', onAbort); resolve(); };
            audio.onerror = () => { signal.removeEventListener('abort', onAbort); reject(new Error('Audio load error')); };
            audio.play().catch((err) => {
                if (err.name === 'NotAllowedError') setIsAudioBlocked(true);
                reject(err);
            });
        });
    }, []);

    const announceWithBrowserTTS = useCallback((text: string, lang: string, signal: AbortSignal): Promise<void> => {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) { resolve(); return; }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
            utterance.rate = 0.9;
            utterance.volume = volumeRef.current;

            const onAbort = () => { window.speechSynthesis.cancel(); resolve(); };
            signal.addEventListener('abort', onAbort, { once: true });
            utterance.onend = () => { signal.removeEventListener('abort', onAbort); resolve(); };
            utterance.onerror = () => { signal.removeEventListener('abort', onAbort); resolve(); };
            window.speechSynthesis.speak(utterance);
        });
    }, []);

    const handleAutomatedAudio = useCallback((audioConfig: AudioConfig): AbortController => {
        const controller = new AbortController();
        const { signal } = controller;

        if (isMutedRef.current) return controller;

        const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8082';
        const ttsUrl = `${FASTAPI_URL}/tts?text=${encodeURIComponent(audioConfig.text)}`;

        (async () => {
            setIsAudioPlaying(true);
            try {
                for (let i = 0; i < (audioConfig.repetitions || 1); i++) {
                    if (signal.aborted) break;
                    try {
                        await playAudioFromUrl(ttsUrl, signal);
                    } catch (err: any) {
                        if (err?.name === 'AbortError') break;
                        console.warn('[PublicTV] Audio auto-play blocked by browser or FastAPI unreachable. Waiting for user gesture or using fallback.');
                        try {
                            await announceWithBrowserTTS(audioConfig.text, audioConfig.lang, signal);
                        } catch {
                            playNotificationSound();
                        }
                    }
                    if (i < (audioConfig.repetitions || 1) - 1 && !signal.aborted) {
                        await new Promise<void>((r) => {
                            const t = setTimeout(r, 1000);
                            signal.addEventListener('abort', () => { clearTimeout(t); r(); }, { once: true });
                        });
                    }
                }
            } finally {
                setIsAudioPlaying(false);
            }
        })();

        return controller;
    }, [playAudioFromUrl, announceWithBrowserTTS, playNotificationSound]);

    return {
        volume, setVolume,
        isMuted, setIsMuted,
        isAudioPlaying,
        isAudioEnabled,
        isAudioBlocked,
        enableAudio,
        handleAutomatedAudio,
        playNotificationSound,
    };
}

// ─────────────────────────────────────────────
// ErrorBoundary — la TV ne doit jamais crasher
// ─────────────────────────────────────────────
class TVErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
    }
    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[PublicTV] Erreur critique capturée:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-screen bg-background flex flex-col items-center justify-center gap-6 p-10 text-center">
                    <Bell className="h-32 w-32 text-primary/20 animate-pulse" />
                    <h1 className="text-4xl font-black text-text-main uppercase tracking-tighter">
                        Oups ! Une erreur est survenue
                    </h1>
                    <p className="text-xl text-text-muted max-w-lg">
                        L'affichage public a rencontré un problème technique.
                        Nos équipes ont été alertées.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-10 py-4 bg-primary text-white rounded-2xl font-black text-xl shadow-xl hover:scale-105 transition-transform"
                    >
                        RECHARGER L'ÉCRAN
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ─────────────────────────────────────────────
// Sous-composant pour la liste des tickets (éviter la duplication)
// ─────────────────────────────────────────────
function TicketItem({ truck }: { truck: DisplayTicket }) {
    return (
        <div
            className={cn(
                "relative rounded-xl p-2 flex items-center justify-between border-2 transition-all duration-700 shadow-sm",
                truck.priority === 'CRITIQUE'
                    ? "border-danger bg-danger/5 shadow-danger/5"
                    : truck.priority === 'URGENT'
                        ? "border-warning bg-warning/5 shadow-warning/5"
                        : "border-slate-100 bg-slate-50/50 hover:bg-white"
            )}
        >
            <div className="flex flex-col">
                <div className={cn(
                    "font-black font-mono tracking-tighter leading-none",
                    truck.priority === 'CRITIQUE' ? "text-danger" :
                        truck.priority === 'URGENT' ? "text-warning" : "text-primary"
                )} style={{ fontSize: '2vh' }}>
                    #{truck.ticketNumber}
                </div>
                <div className="font-black text-slate-400 font-mono tracking-widest uppercase mt-0.2"
                    style={{ fontSize: '0.9vh' }}>
                    {truck.licensePlate}
                </div>
            </div>
            {truck.priority === 'CRITIQUE' && <AlertTriangle className="text-danger animate-pulse h-4 w-4" />}
            {truck.priority === 'URGENT' && <Zap className="text-warning animate-pulse h-4 w-4" />}
        </div>
    );
}

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────
function PublicTVInner() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuthStore();

    const [siteId, setSiteId] = useState<string | null>(() => {
        return searchParams.get('siteId') || localStorage.getItem('lastPublicSiteId') || user?.siteId || null;
    });

    // [AMÉLIORATION 2] siteId retiré des dépendances — searchParams seul suffit pour la sync URL
    useEffect(() => {
        const urlSiteId = searchParams.get('siteId');
        if (urlSiteId) {
            queueMicrotask(() => {
                setSiteId((current) => {
                    if (urlSiteId !== current) {
                        localStorage.setItem('lastPublicSiteId', urlSiteId);
                        return urlSiteId;
                    }
                    return current;
                });
            });
        }
    }, [searchParams]);

    const { data: availableSites, isLoading: isLoadingSites } = useQuery({
        queryKey: ['publicSites'],
        queryFn: () => ticketApi.getPublicSites(),
        enabled: !siteId,
    });

    useEffect(() => {
        if (!siteId && availableSites && availableSites.length === 1) {
            const autoId = availableSites[0].siteId;
            queueMicrotask(() => {
                setSiteId(autoId);
            });
            localStorage.setItem('lastPublicSiteId', autoId);
            setSearchParams({ siteId: autoId }, { replace: true });
        }
    }, [siteId, availableSites, setSearchParams]);

    const [lastCalledTicket, setLastCalledTicket] = useState<LastCalledTicket | null>(null);
    const [isRecall, setIsRecall] = useState(false);
    const [showCallAnimation, setShowCallAnimation] = useState(false);
    const [priorityUpdate, setPriorityUpdate] = useState<{ number: string; priority: string } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // [AMÉLIORATION 7] Ref pour nettoyer le timeout showCallAnimation au démontage
    const callAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        isAudioPlaying,
        isAudioEnabled,
        isAudioBlocked,
        enableAudio,
        handleAutomatedAudio,
        playNotificationSound,
    } = useAudio();

    const audioControllerRef = useRef<AbortController | null>(null);

    const { data: displayData, refetch } = useQuery<DisplayData>({
        queryKey: ['publicDisplay', siteId],
        queryFn: () => siteId ? ticketApi.getPublicDisplayData(siteId) : Promise.resolve({ called: [], waiting: [] }),
        refetchInterval: 30000,
        enabled: !!siteId,
    });

    const calledTicket = displayData?.called?.[0] ?? null;
    const waitingTickets = displayData?.waiting ?? [];
    const isolatedTickets = displayData?.isolated ?? [];

    // [AMÉLIORATION 5] Messages du bandeau depuis l'API, avec fallback sur les constantes
    const marqueeMessages = useMemo(() => {
        if (displayData?.marqueeMessages?.length) return displayData.marqueeMessages;
        
        const siteName = displayData?.siteName || 'SIBM';
        return [`BIENVENUE SUR LE SITE ${siteName.toUpperCase()} DE SIBM — LE PORT DES EPI EST OBLIGATOIRE DURANT TOUTE LA DURÉE DE L'OPÉRATION — SÉCURITÉ D'ABORD !` ];
    }, [displayData?.marqueeMessages, displayData?.siteName]);

    // [AMÉLIORATION] On ne double plus pour éviter l'effet "doublon" si le message est long
    const marqueeContent = marqueeMessages;

    // Cleanup au démontage
    useEffect(() => {
        return () => {
            audioControllerRef.current?.abort();
            // [AMÉLIORATION 7] Nettoyage du timeout au démontage
            if (callAnimationTimeoutRef.current) clearTimeout(callAnimationTimeoutRef.current);
        };
    }, []);

    // [AMÉLIORATION - CATEGORISATION] Filtrage des tickets par catégorie (Plus robuste aux noms complets et accents)
    const infraTickets = useMemo(() => 
        waitingTickets.filter(t => {
            const name = t.categoryName?.toUpperCase() || '';
            return name.includes('INFRA');
        }).slice(0, 5),
        [waitingTickets]
    );
    const elecTickets = useMemo(() => 
        waitingTickets.filter(t => {
            const name = t.categoryName?.toUpperCase() || '';
            // Gère ELECTRICITE, ELECTRICTE, ÉLECTRICITÉ, etc.
            return name.includes('ELEC') || name.includes('ÉLEC');
        }).slice(0, 5),
        [waitingTickets]
    );
    const batimentTickets = useMemo(() => 
        waitingTickets.filter(t => {
            const name = t.categoryName?.toUpperCase() || '';
            // Gère BATIMENT, BÂTIMENT
            return name.includes('BATI') || name.includes('BÂTI');
        }).slice(0, 5),
        [waitingTickets]
    );

    const handleTicketCalled = useCallback((payload: TicketCallPayload) => {
        // Log supprimé pour alléger la console
        const ticket = payload.ticket;
        if (!ticket || ticket.siteId !== siteId) return;

        setIsRecall(Boolean(payload.event === 'ticket_recalled' || payload.isRecall));
        setLastCalledTicket({
            number: ticket.ticketNumber,
            destination: ticket.currentStep?.queue?.name || 'ZONE DE CONTRÔLE',
            licensePlate: ticket.licensePlate,
        });
        setShowCallAnimation(true);
        refetch();

        audioControllerRef.current?.abort();

        if (payload.audio?.enabled && payload.audio.text && payload.audio.lang && payload.audio.repetitions) {
            const audioConfig: AudioConfig = {
                text: payload.audio.text,
                lang: payload.audio.lang,
                repetitions: payload.audio.repetitions,
            };
            audioControllerRef.current = handleAutomatedAudio(audioConfig);
        } else {
            const ticketNumber = ticket.ticketNumber || '';
            const parts = ticketNumber.split('-');
            
            // Fallback intelligent pour le texte d'annonce si le backend ne le fournit pas
            let catPart = 'TICKET';
            let numPart = '0000';
            
            if (parts.length >= 2) {
                numPart = parts[1].split('').join(' ');
                // On essaie de deviner la catégorie (tout ce qui reste après avoir éventuellement retiré un prefixe site)
                catPart = parts[0];
            }
            
            const text = `Le Ticket ${catPart} ${numPart} est appelé au ${ticket.currentStep?.queue?.name || 'poste de travail'}.`;
            audioControllerRef.current = handleAutomatedAudio({ text, lang: 'fr', repetitions: 2 });
        }

        // [AMÉLIORATION 7] Timeout stocké dans un ref pour pouvoir le nettoyer
        if (callAnimationTimeoutRef.current) clearTimeout(callAnimationTimeoutRef.current);
        callAnimationTimeoutRef.current = setTimeout(() => setShowCallAnimation(false), 10000);
    }, [refetch, handleAutomatedAudio, siteId]);

    const handleTicketPriorityUpdated = useCallback((payload: SocketTicketEventPayload) => {
        const data = payload.ticket;
        if (!data) return;
        if (data.siteId !== siteId) return;

        refetch();
        const priorityLabel = data.priority >= 2 ? 'CRITIQUE' : data.priority >= 1 ? 'URGENT' : 'NORMAL';

        if (priorityLabel === 'CRITIQUE' || priorityLabel === 'URGENT') {
            setPriorityUpdate({ number: data.ticketNumber, priority: priorityLabel });
            playNotificationSound();
            setTimeout(() => setPriorityUpdate(null), 8000);
        }
    }, [refetch, playNotificationSound, siteId]);

    const handleRefetch = useCallback(() => refetch(), [refetch]);

    useSocketEvent('ticket_called', handleTicketCalled);
    useSocketEvent('ticket_recalled', handleTicketCalled);
    useSocketEvent('ticket_created', handleRefetch);
    useSocketEvent('ticket_updated', handleRefetch);
    useSocketEvent('ticket_assigned', handleRefetch);
    useSocketEvent('ticket_completed', handleRefetch);
    useSocketEvent('ticket_isolated', handleRefetch);
    useSocketEvent('ticket_unisolated', handleRefetch);
    useSocketEvent('ticket_priority_updated', handleTicketPriorityUpdated);

    // [AMÉLIORATION 1] lastCalledIdRef supprimé — il était mis à jour mais jamais lu

    useEffect(() => {
        // [AMÉLIORATION 3] enableAudio appelé sans await (intentionnel ici) mais les erreurs
        // sont déjà gérées dans enableAudio via try/catch interne — pas de fuite silencieuse

        if (siteId) enableAudio();

        // [AMÉLIORATION 4] .finally() garantit la suppression des listeners même si enableAudio échoue
        const handleFirstInteraction = () => {
            enableAudio().finally(() => {
                window.removeEventListener('click', handleFirstInteraction);
                window.removeEventListener('keydown', handleFirstInteraction);
            });
        };

        window.addEventListener('click', handleFirstInteraction);
        window.addEventListener('keydown', handleFirstInteraction);

        return () => {
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        };
    }, [siteId, enableAudio]);

    if (!siteId) {
        return (
            <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-white p-10">
                <div className="bg-white/10 backdrop-blur-xl p-12 rounded-[3rem] border-2 border-white/20 text-center max-w-2xl w-full">
                    <Building2 className="h-24 w-24 mx-auto mb-8 text-primary" />
                    <h1 className="text-4xl font-black mb-6 uppercase tracking-tighter">Configuration de l'Écran</h1>

                    {isLoadingSites ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-12 bg-white/5 rounded-2xl w-full" />
                            <div className="h-12 bg-white/5 rounded-2xl w-full" />
                        </div>
                    ) : availableSites && availableSites.length > 0 ? (
                        <div className="space-y-4">
                            <p className="text-xl text-white/70 mb-8 leading-relaxed">
                                Veuillez sélectionner le site à afficher sur cet écran :
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                {availableSites.map((site) => (
                                    <button
                                        key={site.siteId}
                                        onClick={() => {
                                            setSiteId(site.siteId);
                                            localStorage.setItem('lastPublicSiteId', site.siteId);
                                            setSearchParams({ siteId: site.siteId }, { replace: true });
                                        }}
                                        className="w-full bg-white/5 hover:bg-primary text-white font-bold py-4 px-6 rounded-2xl text-lg border border-white/10 transition-all text-left flex items-center justify-between group"
                                    >
                                        <span>{site.name}</span>
                                        <div className="h-2 w-2 rounded-full bg-primary group-hover:bg-white" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-xl text-red-400 font-bold uppercase tracking-tight">Aucun site configuré</p>
                            <p className="text-white/50 leading-relaxed">
                                Aucun site n'a été trouvé dans le système. Veuillez contacter un administrateur.
                            </p>
                            <a href="/login" className="inline-block bg-white/10 text-white font-black py-3 px-8 rounded-xl hover:bg-white/20 transition-colors mt-4">
                                ADMINISTRATION
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-background flex flex-col overflow-hidden relative selection:bg-none">

            {/* 1️⃣ BANDEAU MESSAGE — CSS-only marquee */}
            <div className="relative h-[6vh] bg-gradient-to-r from-primary via-primary/95 to-primary border-b-4 border-primary/80 flex items-center overflow-hidden shadow-2xl z-20">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
                
                {/* Clock / Site Info */}
                <div className="absolute left-0 top-0 bottom-0 bg-slate-900/40 backdrop-blur-md px-8 flex items-center gap-4 border-r border-white/10 z-20">
                    <Clock className="h-5 w-5 text-white/50" />
                    <span className="text-white font-black tracking-widest text-[2vh] tabular-nums">
                        {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div
                    className="animate-marquee-slow whitespace-nowrap text-white font-black tracking-widest px-8 relative z-10 flex items-center gap-12 ml-40"
                    style={{ fontSize: '2vh' }}
                >
                    {marqueeContent.map((msg, i) => (
                        <span key={i} className="flex items-center gap-4">
                            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                            {msg}
                        </span>
                    ))}
                </div>
            </div>

            {/* 2️⃣ & 3️⃣ ZONE APPEL + PROCHAINS */}
            <div className="relative flex gap-4 p-4 md:gap-6 md:p-6 overflow-hidden" style={{ height: '94vh' }}>

                {/* 2️⃣ ZONE APPEL / RAPPEL */}
                <div className="relative w-[65%] flex items-center justify-center overflow-hidden rounded-[3rem] shadow-2xl border-4 border-white/50">
                    <div className={cn(
                        "absolute inset-0 transition-all duration-1000",
                        showCallAnimation
                            ? "bg-gradient-to-br from-primary/30 via-primary/20 to-primary/30 animate-pulse-fast"
                            : calledTicket
                                ? "bg-gradient-to-br from-primary/10 via-background to-primary/10"
                                : "bg-gradient-to-br from-slate-100 via-white to-slate-100"
                    )} />
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />

                    {calledTicket ? (
                        <div className={cn(
                            "relative z-10 text-center transform transition-all duration-500 w-full px-8",
                            showCallAnimation && "scale-105"
                        )}>
                            <div className="flex items-center justify-center gap-4 mb-3">
                                {isRecall ? (
                                    <BellRing className={cn("text-warning", showCallAnimation && "animate-shake")}
                                        style={{ width: '4vh', height: '4vh' }} />
                                ) : (
                                    <Bell className={cn("text-primary", showCallAnimation && "animate-bounce")}
                                        style={{ width: '4vh', height: '4vh' }} />
                                )}
                                <h2 className={cn(
                                    "font-black uppercase tracking-tight",
                                    isRecall ? "text-warning" : "text-primary"
                                )} style={{ fontSize: '2.5vh' }}>
                                    {isRecall ? 'RAPPEL TICKET' : 'APPEL TICKET'}
                                </h2>
                            </div>
 
                            <div className={cn(
                                "font-black text-slate-900 leading-none mb-2 font-mono tracking-tighter drop-shadow-xl flex items-center justify-center gap-4",
                                showCallAnimation && "animate-pulse-fast"
                            )} style={{ fontSize: '8vh' }}>
                                <span>#{calledTicket.ticketNumber}</span>
                                {showCallAnimation && <Speaker className="h-10 w-10 text-primary animate-pulse" />}
                            </div>
 
                            <div className="space-y-2">
                                <p className="text-lg font-bold text-text-muted uppercase tracking-[0.2em]">Veuillez vous présenter au :</p>
                                <div className="font-black text-white uppercase tracking-tight bg-primary px-8 py-4 rounded-2xl border-4 border-white/30 inline-block shadow-lg animate-bounce-slow"
                                    style={{ fontSize: '3vh' }}>
                                    {calledTicket.destination}
                                </div>
                            </div>
 
                            <div className="mt-8 font-black text-text-muted font-mono tracking-widest bg-white/80 px-8 py-3 rounded-2xl border-2 border-slate-200 inline-block"
                                style={{ fontSize: '3vh' }}>
                                CAMION: {calledTicket.licensePlate}
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 text-center opacity-30 flex flex-col items-center">
                            <div className="relative mb-4">
                                <Bell className="text-slate-300" style={{ width: '6vh', height: '6vh' }} />
                                <div className="absolute -top-1 -right-1 h-4 w-4 bg-slate-200 rounded-full animate-ping" />
                            </div>
                            <p className="font-black text-slate-300 uppercase tracking-[0.2em]"
                                style={{ fontSize: '2vh' }}>
                                En attente d'appel...
                            </p>
                        </div>
                    )}
                </div>

                {/* 3️⃣ ZONE DES PROCHAINS */}
                <div className="relative w-[35%] bg-white/90 backdrop-blur-md border-2 border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="h-full flex flex-col p-8">
                        <div className="flex items-center justify-between mb-8 shrink-0">
                            <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"
                                style={{ fontSize: '2vh' }}>
                                <div className="h-3 w-3 rounded-full bg-primary animate-pulse shadow-[0_0_100px_rgba(26,127,55,0.5)]" />
                                Prochains Tickets
                            </h3>
                        </div>

                        <div className="flex-1 grid grid-cols-1 gap-6 overflow-hidden">
                            {/* SECTION INFRA */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 pb-1 border-b-2 border-primary/20">
                                    <Zap className="h-4 w-4 text-primary" />
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">INFRA</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {infraTickets.length > 0 ? infraTickets.map(truck => (
                                        <TicketItem key={truck.ticketId} truck={truck} />
                                    )) : <p className="text-[10px] italic text-slate-400">Aucun ticket</p>}
                                </div>
                            </div>
 
                            {/* SECTION ELECTRICITE */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 pb-1 border-b-2 border-blue-500/20">
                                    <Zap className="h-4 w-4 text-blue-500" />
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">ELECTRICTÉ</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {elecTickets.length > 0 ? elecTickets.map(truck => (
                                        <TicketItem key={truck.ticketId} truck={truck} />
                                    )) : <p className="text-[10px] italic text-slate-400">Aucun ticket</p>}
                                </div>
                            </div>
 
                            {/* SECTION BATIMENT */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 pb-1 border-b-2 border-orange-500/20">
                                    <Building2 className="h-4 w-4 text-orange-500" />
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">BATIMENT</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {batimentTickets.length > 0 ? batimentTickets.map(truck => (
                                        <TicketItem key={truck.ticketId} truck={truck} />
                                    )) : <p className="text-[10px] italic text-slate-400">Aucun ticket</p>}
                                </div>
                            </div>

                            {/* [NOUVEAU] SECTION TICKETS ISOLÉS */}
                            {isolatedTickets.length > 0 && (
                                <div className="mt-4 pt-4 border-t-4 border-danger/30 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-danger p-2 rounded-lg animate-pulse">
                                            <AlertTriangle className="h-5 w-5 text-white" />
                                        </div>
                                        <h4 className="font-black text-danger uppercase tracking-tighter" style={{ fontSize: '1.8vh' }}>
                                            TICKETS ISOLÉS
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {isolatedTickets.map(truck => (
                                            <div key={truck.ticketId} className="bg-danger/10 border-2 border-danger rounded-2xl p-3 flex items-center justify-between shadow-lg shadow-danger/10">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-danger font-mono" style={{ fontSize: '2.5vh' }}>
                                                        #{truck.ticketNumber}
                                                    </span>
                                                    <span className="text-[1vh] font-black text-danger/60 uppercase racking-widest">
                                                        {truck.licensePlate}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="bg-danger text-white px-3 py-1 rounded-lg font-black text-[1vh] uppercase">
                                                        Veuillez voir l'agent
                                                    </span>
                                                    <span className="text-[0.8vh] font-bold text-danger/50 mt-1 uppercase">
                                                        {truck.categoryName}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Screen Call Overlay */}
            {showCallAnimation && lastCalledTicket && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center animate-in fade-in zoom-in duration-300">
                    <div className="absolute inset-0 bg-primary/95 backdrop-blur-3xl" />
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                        <div className="w-[120vmax] h-[120vmax] border-[15vmax] border-white/10 rounded-full animate-ping duration-[3s]" />
                        <div className="absolute w-[90vmax] h-[90vmax] border-[10vmax] border-white/5 rounded-full animate-ping duration-[4s]" />
                    </div>

                    <div className="relative text-center p-8 max-w-5xl w-full flex flex-col items-center gap-6">
                        <div className="flex items-center justify-center gap-6 mb-2">
                            {isRecall ? (
                                <BellRing className="text-warning h-24 w-24 animate-shake" />
                            ) : (
                                <Bell className="text-white h-24 w-24 animate-bounce" />
                            )}
                            <h2 className="text-4xl font-black text-white uppercase tracking-[0.25em]">
                                {isRecall ? 'RAPPEL TICKET' : 'APPEL TICKET'}
                            </h2>
                        </div>

                        <div className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-6 border-4 border-white/30 shadow-[0_0_100px_rgba(255,255,255,0.15)] w-full">
                            <span className="text-[6rem] font-black leading-none tracking-tighter text-white drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
                                #{lastCalledTicket.number}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <p className="text-lg font-bold text-white/80 uppercase tracking-[0.3em]">Veuillez vous présenter au :</p>
                            <div className="text-3xl font-black text-white uppercase tracking-tight bg-white/20 px-10 py-3 rounded-2xl border-2 border-white/40 shadow-xl inline-block">
                                {lastCalledTicket.destination}
                            </div>
                        </div>

                        <div className="text-lg font-black text-white/60 font-mono tracking-[0.5em] bg-black/30 px-6 py-2 rounded-xl mt-1">
                            CAMION: {lastCalledTicket.licensePlate}
                        </div>
                    </div>
                </div>
            )}

            {/* Priority Update Overlay */}
            {priorityUpdate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 animate-in fade-in zoom-in duration-500">
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-2xl" />
                    <div className={cn(
                        "relative bg-white rounded-[5rem] shadow-[0_0_150px_rgba(0,0,0,0.3)] border-[12px] p-16 text-center max-w-5xl w-full flex flex-col items-center gap-10",
                        priorityUpdate.priority === 'CRITIQUE' ? "border-danger" : "border-warning"
                    )}>
                        <div className="space-y-6">
                            <h2 className="text-6xl font-black uppercase tracking-tight text-text-main">Priorité Mise à Jour</h2>
                            <div className="flex flex-col items-center gap-4">
                                <span className="text-[15rem] font-black leading-none tracking-tighter text-primary">#{priorityUpdate.number}</span>
                                <span className={cn(
                                    "text-5xl font-black px-16 py-6 rounded-full uppercase tracking-[0.3em] shadow-xl",
                                    priorityUpdate.priority === 'CRITIQUE' ? "bg-danger text-white" : "bg-warning text-black"
                                )}>
                                    PRIORITÉ {priorityUpdate.priority}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Banner d'activation Audio */}
            {isAudioBlocked && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[210] animate-in slide-in-from-bottom-5 fade-in duration-700">
                    <button
                        onClick={enableAudio}
                        className="bg-primary hover:bg-primary-dark text-white font-black py-4 px-10 rounded-full shadow-[0_10px_40px_rgba(var(--primary-rgb),0.5)] flex items-center gap-4 group transition-all hover:scale-105"
                    >
                        <Zap className="h-6 w-6 animate-pulse group-hover:scale-125 transition-transform" />
                        <span className="text-xl uppercase tracking-widest">Cliquez n'importe où pour activer le son</span>
                    </button>
                </div>
            )}

            {/* Indicateur d'état Audio */}
            <div className="fixed bottom-2 right-2 z-[200] flex items-center gap-2 px-2 py-1 bg-black/40 backdrop-blur rounded text-[10px] text-white/50 border border-white/10 uppercase font-black tracking-widest">
                <Speaker className={cn("w-3 h-3", isAudioPlaying && "text-green-400 animate-pulse")} />
                <span>{isAudioBlocked ? (
                    <span className="text-danger">Bloqué</span>
                ) : (
                    isAudioEnabled ? <span className="text-green-400">Actif</span> : "Init..."
                )}</span>
                {isAudioBlocked && (
                    <button
                        onClick={(e) => { e.stopPropagation(); enableAudio(); }}
                        className="ml-2 px-2 py-0.5 bg-primary/20 hover:bg-primary/40 rounded text-white border border-primary/30 transition-colors pointer-events-auto"
                    >
                        Activer
                    </button>
                )}
            </div>

            <style>{`
                @keyframes marquee-slow {
                    0%   { transform: translateX(100vw); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee-slow {
                    animation: marquee-slow 30s linear infinite;
                    display: inline-block;
                    white-space: nowrap;
                    will-change: transform;
                }
                @keyframes pulse-fast {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                .animate-pulse-fast { animation: pulse-fast 0.8s ease-in-out infinite; }

                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
                .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }

                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
                    20%, 40%, 60%, 80% { transform: rotate(10deg); }
                }
                .animate-shake { animation: shake 0.5s ease-in-out infinite; }

                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-20px) scale(1.02); }
                }
                .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
            `}</style>
        </div>
    );
}

// ─────────────────────────────────────────────
// Export : enveloppé dans l'ErrorBoundary
// ─────────────────────────────────────────────
export default function PublicTV() {
    return (
        <TVErrorBoundary>
            <PublicTVInner />
        </TVErrorBoundary>
    );
}
