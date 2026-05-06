import bcrypt from 'bcrypt';
import { User, Role, sequelize } from '../models/index.js';
import logger from '../config/logger.js';

async function createProdAdmin() {
    try {
        await sequelize.authenticate();
        const role = await Role.findOne({ where: { name: 'ADMINISTRATOR' } });
        if (!role) throw new Error('Role ADMINISTRATOR not found');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('SIBMlab@2026', salt);

        const [user, created] = await User.findOrCreate({
            where: { username: 'LABELMANAGER' },
            defaults: {
                email: 'info.dsi@sibmci.com',
                password: hashedPassword,
                firstName: 'ADMIN',
                lastName: 'DSI',
                roleId: role.roleId,
                isActive: true
            }
        });

        if (created) {
            logger.info('Production Admin user LABELMANAGER created.');
        } else {
            logger.info('Production Admin user LABELMANAGER already exists.');
        }
        process.exit(0);
    } catch (error) {
        logger.error('Failed to create prod admin:', error);
        process.exit(1);
    }
}

createProdAdmin();
