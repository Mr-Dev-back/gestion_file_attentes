import { v4 as uuidv4 } from 'uuid';

export default {
    async up(queryInterface, Sequelize) {
        // Get or create a default site
        const [sites] = await queryInterface.sequelize.query(
            `SELECT "siteId" FROM "Site" LIMIT 1;`
        );

        let siteId;
        if (sites.length > 0) {
            siteId = sites[0].siteId;
        } else {
            // Create a default company first
            const [companies] = await queryInterface.sequelize.query(
                `SELECT "companyId" FROM "Company" LIMIT 1;`
            );

            let companyId;
            if (companies.length > 0) {
                companyId = companies[0].companyId;
            } else {
                companyId = uuidv4();
                await queryInterface.bulkInsert('Company', [{
                    companyId: companyId,
                    name: 'SIBM',
                    code: 'SIBM',
                    isActived: true,
                    createdAt: new Date()
                }]);
            }

            // Create default site
            siteId = uuidv4();
            await queryInterface.bulkInsert('Site', [{
                siteId: siteId,
                companyId: companyId,
                name: 'Site Principal',
                code: 'MAIN',
                isActived: true,
                alertThreshold: 45,
                createdAt: new Date()
            }]);
        }

        // Create the three main queues
        const bureauVenteId = uuidv4();
        const chargementId = uuidv4();
        const pontBasculeId = uuidv4();

        await queryInterface.bulkInsert('Queue', [
            {
                queueId: bureauVenteId,
                name: 'Bureau de Vente',
                isActived: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                queueId: chargementId,
                name: 'Chargement',
                isActived: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                queueId: pontBasculeId,
                name: 'Pont Bascule',
                isActived: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        // Link all categories to all queues (many-to-many)
        const [categories] = await queryInterface.sequelize.query(
            `SELECT "categoryId" FROM "Category";`
        );

        const categoryQueueLinks = [];
        categories.forEach(category => {
            [bureauVenteId, chargementId, pontBasculeId].forEach(queueId => {
                categoryQueueLinks.push({
                    categoryId: category.categoryId,
                    queueId: queueId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            });
        });

        if (categoryQueueLinks.length > 0) {
            await queryInterface.bulkInsert('CategoryQueue', categoryQueueLinks);
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('CategoryQueue', null, {});
        await queryInterface.bulkDelete('Queue', null, {});
    }
};
