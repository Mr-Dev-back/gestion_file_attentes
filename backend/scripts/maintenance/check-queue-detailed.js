import { sequelize } from '../../src/models/index.js';
async function run() {
  try {
    const columns = await sequelize.getQueryInterface().describeTable('Queue');
    console.log(JSON.stringify(columns, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
