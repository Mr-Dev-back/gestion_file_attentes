import { SystemSetting, Site } from '../models/index.js';
import logger from '../config/logger.js';

async function seedAudioSettings() {
    try {
        const sites = await Site.findAll();

        for (const site of sites) {
            const settings = [
                {
                    key: 'AUDIO_ENABLED',
                    value: 'true',
                    type: 'BOOLEAN',
                    scope: 'SITE',
                    scopeId: site.siteId,
                    category: 'AUDIO',
                    description: 'Activer/Désactiver les appels sonores automatisés'
                },
                {
                    key: 'AUDIO_LANG',
                    value: 'fr',
                    type: 'STRING',
                    scope: 'SITE',
                    scopeId: site.siteId,
                    category: 'AUDIO',
                    description: 'Langue de la synthèse vocale (fr, en, etc.)'
                },
                {
                    key: 'AUDIO_REPETITIONS',
                    value: '1',
                    type: 'INTEGER',
                    scope: 'SITE',
                    scopeId: site.siteId,
                    category: 'AUDIO',
                    description: 'Nombre de répétitions pour chaque appel'
                }
            ];

            for (const setting of settings) {
                await SystemSetting.findOrCreate({
                    where: { key: setting.key, scopeId: setting.scopeId },
                    defaults: setting
                });
            }
        }

        logger.info('Audio settings seeded successfully.');
    } catch (error) {
        logger.error('Error seeding audio settings:', error);
    }
}

seedAudioSettings();
