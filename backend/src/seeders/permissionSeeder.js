import { Resource, Action, Permission, sequelize } from '../models/index.js';

const RESOURCES = [
    { name: 'Utilisateurs', slug: 'USER', description: 'Gestion des comptes utilisateurs et profils' },
    { name: 'Rôles & Permissions', slug: 'ROLE', description: 'Configuration des accès et droits' },
    { name: 'Tickets', slug: 'TICKET', description: 'Gestion des tickets de pesée et d\'exploitation' },
    { name: 'Files d\'attente', slug: 'QUEUE', description: 'Configuration des files de traitement' },
    { name: 'Sites', slug: 'SITE', description: 'Paramétrage des sites physiques' },
    { name: 'Quais', slug: 'QUAI', description: 'Gestion des points de passage et terminaux' },
    { name: 'Rapports', slug: 'REPORT', description: 'Accès aux statistiques et exports' },
    { name: 'Workflows', slug: 'WORKFLOW', description: 'Configuration des parcours clients' },
    { name: 'Bornes', slug: 'BORNE', description: 'Gestion des bornes tactiles' }
];

const ACTIONS = [
    { name: 'Créer', slug: 'CREATE', description: 'Droit de création d\'un nouvel objet' },
    { name: 'Lire', slug: 'READ', description: 'Droit de consultation des données' },
    { name: 'Modifier', slug: 'UPDATE', description: 'Droit d\'édition des données existantes' },
    { name: 'Supprimer', slug: 'DELETE', description: 'Droit de suppression' },
    { name: 'Valider', slug: 'VALIDATE', description: 'Droit de validation/approbation (ex: pesée)' },
    { name: 'Transférer', slug: 'TRANSFER', description: 'Droit de réassignation ou transfert' },
    { name: 'Appeler', slug: 'CALL', description: 'Droit d\'appel d\'un véhicule au quai' },
    { name: 'Imprimer', slug: 'PRINT', description: 'Droit de génération de documents physiques' }
];

async function seedPermissions() {
    try {
        console.log('--- DEBUT DE LA MIGRATION DES PERMISSIONS ---');

        console.log('Synchronisation des modèles...');
        await sequelize.sync();

        const transaction = await sequelize.transaction();
        try {
            // 1. Peupler les Ressources
            const resourceMap = {};
            for (const resData of RESOURCES) {
                const [resource] = await Resource.findOrCreate({
                    where: { slug: resData.slug },
                    defaults: resData,
                    transaction
                });
                resourceMap[resData.slug] = resource.resourceId;
            }
            console.log('✔ Ressources initialisées');

            // 2. Peupler les Actions
            const actionMap = {};
            for (const actData of ACTIONS) {
                const [action] = await Action.findOrCreate({
                    where: { slug: actData.slug },
                    defaults: actData,
                    transaction
                });
                actionMap[actData.slug] = action.actionId;
            }
            console.log('✔ Actions initialisées');

            // 3. Générer la Matrice de Permissions
            let createdCount = 0;
            let updatedCount = 0;

            for (const resSlug in resourceMap) {
                for (const actSlug in actionMap) {
                    const code = `${resSlug}:${actSlug}`.toUpperCase();
                    const resourceId = resourceMap[resSlug];
                    const actionId = actionMap[actSlug];

                    const [permission, created] = await Permission.findOrCreate({
                        where: { code },
                        defaults: {
                            code,
                            resourceId,
                            actionId
                        },
                        transaction
                    });

                    if (!created) {
                        await permission.update({
                            resourceId,
                            actionId,
                            resource: null,
                            action: null
                        }, { transaction });
                        updatedCount++;
                    } else {
                        createdCount++;
                    }
                }
            }
            console.log(`✔ Matrice de permissions : ${updatedCount} mises à jour, ${createdCount} créations`);

            await transaction.commit();
            console.log('--- MIGRATION TERMINEE AVEC SUCCES ---');

        } catch (innerError) {
            await transaction.rollback();
            throw innerError;
        }

    } catch (error) {
        console.error('❌ ERREUR LORS DE LA MIGRATION :', error);
        throw error;
    }
}

export { seedPermissions };

if (process.argv[1] && process.argv[1].includes('permissionSeeder.js')) {
    seedPermissions()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
