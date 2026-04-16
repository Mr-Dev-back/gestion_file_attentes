import { sequelize } from '../src/config/database.js';
import Category from '../src/models/Category.js';

const categories = [
    {
        name: 'Matériaux bâtiment',
        description: 'Béton, ciment, agrégats, matériaux de construction',
        color: '#3B82F6',
        prefix: 'BATIMENT',
        estimatedDuration: 30,
        isActive: true
    },
    {
        name: 'Infrastructure',
        description: 'Matériaux pour infrastructure et travaux publics',
        color: '#F59E0B',
        prefix: 'INFRA',
        estimatedDuration: 25,
        isActive: true
    },
    {
        name: 'Électricité',
        description: 'Matériaux électriques, poteaux, câbles',
        color: '#EF4444',
        prefix: 'ELECT',
        estimatedDuration: 35,
        isActive: true
    }
];

async function resetCategories() {
    try {
        console.log('🔄 Connexion à la base de données...');
        await sequelize.authenticate();

        console.log('🗑️  Suppression des anciennes catégories...');
        await Category.destroy({ where: {}, truncate: true });

        console.log('✨ Création des nouvelles catégories...');
        for (const cat of categories) {
            const created = await Category.create(cat);
            console.log(`   ✓ ${created.name} (${created.prefix})`);
        }

        console.log('\n✅ Catégories réinitialisées avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

resetCategories();
