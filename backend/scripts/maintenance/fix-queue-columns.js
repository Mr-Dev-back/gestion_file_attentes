import { sequelize } from '../../src/models/index.js';
import { Sequelize } from 'sequelize';

async function run() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('Queue');
    
    if (!tableInfo.stepId) {
      console.log('Adding stepId to Queue...');
      await queryInterface.addColumn('Queue', 'stepId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'WorkflowStep', key: 'stepId' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!tableInfo.quaiId) {
      console.log('Adding quaiId to Queue...');
      await queryInterface.addColumn('Queue', 'quaiId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'QuaiParameter', key: 'quaiId' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    console.log('Database columns added successfully (if missing).');
  } catch (e) {
    console.error('Error during manual migration:', e);
  }
  process.exit(0);
}
run();
