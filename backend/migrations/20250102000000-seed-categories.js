import { v4 as uuidv4 } from 'uuid';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Category', [
      {
        categoryId: uuidv4(),
        name: 'Matériaux bâtiment',
        prefix: 'BATIMENT',
        color: '#3B82F6',
        estimatedDuration: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        categoryId: uuidv4(),
        name: 'Infrastructure',
        prefix: 'INFRA',
        color: '#F59E0B',
        estimatedDuration: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        categoryId: uuidv4(),
        name: 'Électricité',
        prefix: 'ELECT',
        color: '#EF4444',
        estimatedDuration: 35,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Category', null, {});
  }
};