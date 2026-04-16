import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function migrate() {
    try {
        // Rendre updatedAt nullable pour éviter les erreurs d'insertion sans timestamps
        await s.query('ALTER TABLE "AuditLog" ALTER COLUMN "updatedAt" DROP NOT NULL');
        console.log('OK: updatedAt is now nullable in AuditLog');
    } catch (e) { console.error('updatedAt error:', e.message); }

    try {
        // Vérifier d'autres colonnes qui pourraient bloquer l'insertion
        // entityType et entityId d'après les colonnes précédemment vues
        await s.query('ALTER TABLE "AuditLog" ALTER COLUMN "entityType" DROP NOT NULL');
        await s.query('ALTER TABLE "AuditLog" ALTER COLUMN "entityId" DROP NOT NULL');
        console.log('OK: entityType and entityId are now nullable in AuditLog');
    } catch (e) { console.error('other columns error:', e.message); }

    process.exit(0);
}
migrate();
