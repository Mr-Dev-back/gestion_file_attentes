import { sequelize } from '../../src/config/database.js';

async function cleanup() {
  const tablesToDrop = [
    'users',
    'roles',
    'tickets',
    'categories',
    'audit_logs',
    'user_roles'
  ];

  console.log('--- Cleaning up duplicate tables ---');
  
  for (const table of tablesToDrop) {
    try {
      await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
      console.log(`Dropped table: ${table}`);
    } catch (error) {
      console.error(`Error dropping table ${table}:`, error.message);
    }
  }

  console.log('--- Done ---');
  process.exit(0);
}

cleanup();
