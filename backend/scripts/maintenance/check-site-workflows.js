import { Sequelize } from 'sequelize';
const s = new Sequelize('gfa', 'postgres', 'sibmlab@1014', { host: 'localhost', dialect: 'postgres' });
async function check() {
    try {
        const [sites] = await s.query('SELECT "siteId", "name", "workflowId" FROM "Site"');
        console.log('Sites and their workflows:');
        sites.forEach(site => {
            console.log(`- ${site.name} (${site.siteId}): Workflow: ${site.workflowId || 'NONE'}`);
        });
        
        const [workflows] = await s.query('SELECT "workflowId", "name" FROM "Workflow"');
        console.log('\nAvailable Workflows:');
        workflows.forEach(wf => {
            console.log(`- ${wf.name} (${wf.workflowId})`);
        });
    } catch (e) { console.error('Error:', e.message); }
    process.exit(0);
}
check();
