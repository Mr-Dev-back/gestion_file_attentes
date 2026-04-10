export default {
    up: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable('QuaiParameter');
        if (!table.siteId) {
            await queryInterface.addColumn('QuaiParameter', 'siteId', {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'Site', key: 'siteId' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('QuaiParameter', 'siteId');
    }
};
