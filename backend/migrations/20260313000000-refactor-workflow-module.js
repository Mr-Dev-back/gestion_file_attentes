
export default {
  up: async (queryInterface, Sequelize) => {
    // 1. Mise à jour de WorkflowStep
    await queryInterface.renameColumn('WorkflowStep', 'order', 'orderNumber');
    await queryInterface.removeColumn('WorkflowStep', 'isInitial');
    await queryInterface.removeColumn('WorkflowStep', 'isFinal');
    await queryInterface.removeColumn('WorkflowStep', 'formConfig');

    // 2. Création de QuaiConfig
    await queryInterface.createTable('QuaiConfig', {
      quaiId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      label: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      siteId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Site', key: 'siteId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Category', key: 'categoryId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 3. Création de StepParameter
    await queryInterface.createTable('StepParameter', {
      stepParameterId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      stepId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'WorkflowStep', key: 'stepId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quaiId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'QuaiConfig', key: 'quaiId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      formConfig: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 4. Création de TicketStep
    await queryInterface.createTable('TicketStep', {
      ticketStepId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      ticketId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Ticket', key: 'ticketId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      stepId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'WorkflowStep', key: 'stepId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isIsolated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TicketStep');
    await queryInterface.dropTable('StepParameter');
    await queryInterface.dropTable('QuaiConfig');
    
    await queryInterface.renameColumn('WorkflowStep', 'orderNumber', 'order');
    await queryInterface.addColumn('WorkflowStep', 'isInitial', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    await queryInterface.addColumn('WorkflowStep', 'isFinal', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    await queryInterface.addColumn('WorkflowStep', 'formConfig', {
      type: Sequelize.JSONB,
      defaultValue: {}
    });
  }
};
