import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function update() {
    try {
        await s.query('UPDATE "Site" SET "workflowId" = \'eb9b8d4d-5ec9-4968-a936-55fda8d80882\' WHERE "code" = \'SSP\'');
        console.log('OK: Workflow assigned to SSP');
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
update();
