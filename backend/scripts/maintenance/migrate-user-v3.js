import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function migrate() {
    try {
        // Renommage des colonnes pour correspondre au modèle V3
        await s.query('ALTER TABLE "User" RENAME COLUMN "hashedPassword" TO "password"');
        console.log('OK: hashedPassword -> password');
    } catch (e) { console.error('password error:', e.message); }

    try {
        await s.query('ALTER TABLE "User" RENAME COLUMN "failedLoginAttempts" TO "failedAttempts"');
        console.log('OK: failedLoginAttempts -> failedAttempts');
    } catch (e) { console.error('failedAttempts error:', e.message); }

    try {
        // Ajout des colonnes manquantes si nécessaire (firstName/lastName existent déjà d'après le check)
        // Mais vérifions si elles sont présentes
        await s.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" VARCHAR(100)');
        await s.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" VARCHAR(100)');
        console.log('OK: firstName/lastName verified');
    } catch (e) { console.error('names error:', e.message); }

    process.exit(0);
}
migrate();
