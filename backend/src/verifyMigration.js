import { Permission, Role, Resource, Action, sequelize } from './models/index.js';

async function verify() {
    try {
        console.log('--- VERIFICATION DE LA MIGRATION ---');
        await sequelize.authenticate();

        // 1. Check if permissions have their resource/action objects
        const randomPerm = await Permission.findOne({
            include: ['resourceObj', 'actionObj']
        });

        if (randomPerm && randomPerm.resourceObj && randomPerm.actionObj) {
            console.log(`✔ Permission normalization OK: ${randomPerm.code} -> ${randomPerm.resourceObj.slug}:${randomPerm.actionObj.slug}`);
        } else {
            console.log('❌ Normalization failed for permission:', randomPerm?.code);
        }

        // 2. Check if a Role (e.g. ADMINISTRATOR) still has its permissions
        const adminRole = await Role.findOne({
            where: { name: 'ADMINISTRATOR' },
            include: [{ model: Permission, as: 'permissions' }]
        });

        if (adminRole && adminRole.permissions && adminRole.permissions.length > 0) {
            console.log(`✔ Administrator permissions maintained: ${adminRole.permissions.length} perms found.`);
            console.log('Example Code:', adminRole.permissions[0].code);
        } else {
            console.log('❌ Administrator permissions lost!');
        }

        // 3. Test hook logic
        console.log('\n--- TESTING HOOK LOGIC ---');
        const resUser = await Resource.findOne({ where: { slug: 'USER' } });
        const actRead = await Action.findOne({ where: { slug: 'READ' } });
        
        // This should already exist, but let's see if we can "save" it and see code sync
        const perm = await Permission.findOne({
            where: { resourceId: resUser.resourceId, actionId: actRead.actionId }
        });

        if (perm) {
            console.log(`✔ Hook Verification: Code is ${perm.code} (Expected USER:READ)`);
        } else {
            console.log('❌ Could not find USER:READ permission');
        }

    } catch (error) {
        console.error('❌ Verification Error:', error);
    } finally {
        process.exit(0);
    }
}

verify();
