console.log('Testing imports...');
import { sequelize } from './src/config/database.js';
console.log('Database config imported');
import User from './src/models/User.js';
console.log('User model imported');
import './src/models/index.js';
console.log('All models imported');
process.exit(0);
