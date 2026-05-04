import { SystemSetting } from '../models/index.js';
import logger from '../config/logger.js';

const SETTINGS = [
    // ALERTS & SLA
    { 
        key: 'MAX_WAIT_TIME_SALES', 
        value: '15', 
        type: 'INTEGER', 
        category: 'ALERTS', 
        description: 'Temps d\'attente maximum (minutes) au Bureau des Ventes avant alerte.' 
    },
    { 
        key: 'MAX_WAIT_TIME_LOADING', 
        value: '45', 
        type: 'INTEGER', 
        category: 'ALERTS', 
        description: 'Temps de chargement maximum (minutes) autorisé.' 
    },
    { 
        key: 'MAX_WAIT_TIME_WEIGHING', 
        value: '10', 
        type: 'INTEGER', 
        category: 'ALERTS', 
        description: 'Temps d\'attente maximum (minutes) au Pont Bascule.' 
    },
    
    // GENERAL
    { 
        key: 'SITE_OPENING_TIME', 
        value: '07:30', 
        type: 'STRING', 
        category: 'GENERAL', 
        description: 'Heure d\'ouverture du site pour les camions.' 
    },
    { 
        key: 'SITE_CLOSING_TIME', 
        value: '17:30', 
        type: 'STRING', 
        category: 'GENERAL', 
        description: 'Heure de fermeture du site.' 
    },
    { 
        key: 'AUTO_REFRESH_INTERVAL', 
        value: '30', 
        type: 'INTEGER', 
        category: 'GENERAL', 
        description: 'Intervalle de rafraîchissement des données (secondes).' 
    },

    // DISPLAY
    { 
        key: 'TV_THEME_COLOR', 
        value: '#0F172A', 
        type: 'STRING', 
        category: 'DISPLAY', 
        description: 'Couleur de fond principale de l\'écran public.' 
    },
    { 
        key: 'TV_SHOW_WEATHER', 
        value: 'true', 
        type: 'BOOLEAN', 
        category: 'DISPLAY', 
        description: 'Afficher la météo sur l\'écran public.' 
    },
    { 
        key: 'TV_ANNOUNCEMENT_VOLUME', 
        value: '0.8', 
        type: 'DECIMAL', 
        category: 'DISPLAY', 
        description: 'Volume des annonces sonores (0.0 à 1.0).' 
    },

    // NOTIFICATIONS
    { 
        key: 'ENABLE_AUDIO_NOTIFICATIONS', 
        value: 'true', 
        type: 'BOOLEAN', 
        category: 'NOTIFICATIONS', 
        description: 'Activer les appels vocaux automatisés.' 
    },
    { 
        key: 'ENABLE_SMS_ALERTS', 
        value: 'false', 
        type: 'BOOLEAN', 
        category: 'NOTIFICATIONS', 
        description: 'Envoyer des SMS aux superviseurs en cas de retard critique.' 
    }
];

export const seedSystemSettings = async () => {
    logger.info('Seeding System Settings...');
    
    for (const s of SETTINGS) {
        await SystemSetting.findOrCreate({
            where: { key: s.key, scope: 'GLOBAL' },
            defaults: s
        });
    }
    
    logger.info('System Settings seeded successfully.');
};
