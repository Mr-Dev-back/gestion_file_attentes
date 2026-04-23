import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

async function updateEnums() {
    try {
        logger.info('Updating TicketHistory event enum...');

        // We can't use transactions for ALTER TYPE ADD VALUE in some Postgres versions/configurations
        const newValues = ['LOADING_START', 'LOADING_END', 'INCIDENT', 'STATUS_UPDATED'];

        for (const val of newValues) {
            try {
                await sequelize.query(`ALTER TYPE "enum_TicketHistory_event" ADD VALUE IF NOT EXISTS '${val}'`);
                logger.info(`Added ${val} to enum_TicketHistory_event`);
            } catch (e) {
                if (e.message.includes('already exists')) {
                    logger.info(`${val} already exists in enum_TicketHistory_event`);
                } else {
                    logger.error(`Error adding ${val}: ${e.message}`);
                }
            }
        }

        logger.info('ENUM update completed');
        process.exit(0);
    } catch (error) {
        logger.error('Failed to update ENUMs:', error);
        process.exit(1);
    }
}

updateEnums();
