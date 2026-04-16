import { sequelize } from './src/models/index.js';

try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    console.log('Models loaded successfully.');
    process.exit(0);
} catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
}
