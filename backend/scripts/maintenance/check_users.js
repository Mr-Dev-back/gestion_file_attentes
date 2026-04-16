import { User, Role } from '../../src/models/index.js';
import { sequelize } from '../../src/config/database.js';
import fs from 'fs';

async function checkUser() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({
            include: [{ model: Role, as: 'assignedRole' }]
        });
        let output = '--- List of Users ---\n';
        users.forEach(u => {
            output += `Email: [${u.email}], Username: [${u.username}], Role: [${u.assignedRole?.name}]\n`;
        });
        fs.writeFileSync('users_output.txt', output);
        console.log('Results written to users_output.txt');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUser();
