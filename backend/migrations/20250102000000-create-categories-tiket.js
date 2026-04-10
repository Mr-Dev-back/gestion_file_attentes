'use strict';

export default {
  async up(queryInterface, Sequelize) {
    // Table Category
    await queryInterface.createTable('Category', {
      categoryId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      prefix: {
        type: Sequelize.STRING(10)
      },
      color: {
        type: Sequelize.STRING(20),
        defaultValue: '#3B82F6'
      },
      estimatedDuration: {
        type: Sequelize.INTEGER,
        defaultValue: 30
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Table Ticket
    await queryInterface.createTable('Ticket', {
      ticketId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      ticketNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      siteId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      categoryId: {
        type: Sequelize.UUID,
        references: { model: 'Category', key: 'categoryId' }
      },
      currentStepId: {
        type: Sequelize.UUID
      },
      status: {
        type: Sequelize.ENUM('EN_ATTENTE', 'APPELE', 'EN_TRAITEMENT', 'ISOLE', 'TRANSFERE', 'COMPLETE', 'ANNULE'),
        defaultValue: 'EN_ATTENTE'
      },
      driverName: { type: Sequelize.STRING(100) },
      driverPhone: { type: Sequelize.STRING(20) },
      licensePlate: { type: Sequelize.STRING(20) },
      orderNumber: { type: Sequelize.STRING(50) },
      companyName: { type: Sequelize.STRING(100) },
      weightIn: { type: Sequelize.DECIMAL(10, 2) },
      weightOut: { type: Sequelize.DECIMAL(10, 2) },
      priority: { type: Sequelize.SMALLINT, defaultValue: 0 },
      priorityReason: { type: Sequelize.STRING(255) },
      recallCount: { type: Sequelize.SMALLINT, defaultValue: 0 },
      arrivedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      calledAt: { type: Sequelize.DATE },
      startedAt: { type: Sequelize.DATE },
      completedAt: { type: Sequelize.DATE },
      calledBy: { type: Sequelize.UUID },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tickets');
    await queryInterface.dropTable('categories');
    
    // Supprimer les ENUMs
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tickets_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tickets_priority";');
  }
};