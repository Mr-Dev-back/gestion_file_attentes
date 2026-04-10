
export default {
  up: async (queryInterface, Sequelize) => {
    // 1. Mise à jour de la table Queue
    // Ajout des colonnes pour lier la file à une étape, une catégorie et un quai physique
    await queryInterface.addColumn('Queue', 'stepId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'WorkflowStep', key: 'stepId' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Queue', 'categoryId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Category', key: 'categoryId' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Queue', 'quaiId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'QuaiParameter', key: 'quaiId' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 2. Mise à jour de la table User
    // Ajout de la file d'attente assignée pour l'isolation de l'Agent de Quai
    await queryInterface.addColumn('User', 'assignedQueueId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Queue', key: 'queueId' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 3. Indexation pour les performances de filtrage
    await queryInterface.addIndex('Queue', ['stepId', 'categoryId']);
    await queryInterface.addIndex('User', ['assignedQueueId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('User', 'assignedQueueId');
    await queryInterface.removeColumn('Queue', 'quaiId');
    await queryInterface.removeColumn('Queue', 'categoryId');
    await queryInterface.removeColumn('Queue', 'stepId');
  }
};
