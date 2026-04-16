import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function migrate() {
    try {
        await s.query('ALTER TABLE "Ticket" RENAME COLUMN "stepId" TO "currentStepId"');
        console.log('OK: stepId -> currentStepId');
    } catch (e) { console.error('currentStepId error:', e.message); }

    try {
        await s.query('ALTER TABLE "Ticket" RENAME COLUMN "calledById" TO "calledBy"');
        console.log('OK: calledById -> calledBy');
    } catch (e) { console.error('calledBy error:', e.message); }

    try {
        await s.query('ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "categoryId" UUID REFERENCES "Category"("categoryId")');
        console.log('OK: categoryId added');
    } catch (e) { console.error('categoryId error:', e.message); }

    try {
        await s.query('ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP WITH TIME ZONE');
        console.log('OK: startedAt added');
    } catch (e) { console.error('startedAt error:', e.message); }

    try {
        // Change priority from Enum to Smallint if needed
        // First check current data
        await s.query('ALTER TABLE "Ticket" ALTER COLUMN "priority" TYPE SMALLINT USING (CASE WHEN priority::text = \'HIGH\' THEN 2 WHEN priority::text = \'NORMAL\' THEN 0 ELSE 1 END)');
        await s.query('ALTER TABLE "Ticket" ALTER COLUMN "priority" SET DEFAULT 0');
        console.log('OK: priority converted to smallint');
    } catch (e) { console.error('priority error:', e.message); }

    process.exit(0);
}
migrate();
