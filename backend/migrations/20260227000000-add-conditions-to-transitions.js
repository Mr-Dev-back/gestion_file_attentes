export default {
    up: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable('WorkflowTransition');
        if (!table.conditions) {
            await queryInterface.addColumn('WorkflowTransition', 'conditions', {
                type: Sequelize.JSON,
                defaultValue: {},
                comment: 'Conditions à remplir pour effectuer cette transition'
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('WorkflowTransition', 'conditions');
    }
};
