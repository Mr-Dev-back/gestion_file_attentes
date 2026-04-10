const FAST_API_URL = import.meta.env.VITE_FASTAPI_URL || '/fastapi';

export const playVoiceCall = async (text: string) => {
    try {
        const url = `${FAST_API_URL}/tts?text=${encodeURIComponent(text)}`;
        const audio = new Audio(url);
        await audio.play();
    } catch (error) {
        console.error('Erreur lors de la lecture vocale:', error);
    }
};
