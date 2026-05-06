/**
 * Utility to play alert sounds for critical events in GesParc.
 */

// Simple beep using Web Audio API to avoid external dependencies
const playBeep = (frequency = 440, duration = 0.5, volume = 0.1) => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.error("Erreur lors de la lecture du son:", error);
    }
};

export const soundAlerts = {
    // Standard notification for a new ticket
    playNewTicket: () => {
        playBeep(523.25, 0.3, 0.1); // C5
        setTimeout(() => playBeep(659.25, 0.4, 0.1), 150); // E5
    },

    // Urgent alert (30 min)
    playUrgent: () => {
        playBeep(440, 0.5, 0.15); // A4
    },

    // Critical alert (> 45 min) - More "insistent"
    playCritical: () => {
        playBeep(880, 0.2, 0.2); // A5
        setTimeout(() => playBeep(880, 0.2, 0.2), 300);
        setTimeout(() => playBeep(880, 0.4, 0.2), 600);
    }
};
