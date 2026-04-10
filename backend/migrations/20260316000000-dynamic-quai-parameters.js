
export default {
  up: async (queryInterface, Sequelize) => {
    // 1. Mise à jour de WorkflowStep (Suppression colonnes et renommage PK)
    // Note: Le renommage de PK peut être complexe selon les contraintes existantes. 
    // On s'assure de la suppression des colonnes isInitial/isFinal demandée.
    const tableInfo = await queryInterface.describeTable('WorkflowStep');
    if (tableInfo.isInitial) await queryInterface.removeColumn('WorkflowStep', 'isInitial');
    if (tableInfo.isFinal) await queryInterface.removeColumn('WorkflowStep', 'isFinal');

    // 2. Création de QuaiParameter
    await queryInterface.createTable('QuaiParameter', {
      parameterID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      label: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Category', key: 'categoryId' }
      },
      stepId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'WorkflowStep', key: 'stepId' }
      },
      formConfig: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      allowedUsers: {
        type: Sequelize.JSONB,
        defaultValue: []
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

    // 3. Enrichissement de TicketStep
    const tsInfo = await queryInterface.describeTable('TicketStep');
    if (!tsInfo.startedAt) {
      await queryInterface.addColumn('TicketStep', 'startedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
    if (!tsInfo.completedAt) {
      await queryInterface.addColumn('TicketStep', 'completedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
    if (!tsInfo.isIsolated) {
      await queryInterface.addColumn('TicketStep', 'isIsolated', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('QuaiParameter');
    // Le retour en arrière des colonnes WorkflowStep n'est pas recommandé sans sauvegarde
  }
};
