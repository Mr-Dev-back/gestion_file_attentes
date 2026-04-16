import bcrypt from 'bcrypt';
import { User } from './src/models/index.js';
import { sequelize } from './src/config/database.js';

async function fixPasswords() {
    try {
        await sequelize.authenticate();
        console.log('Database connection successful.');

        const users = await User.findAll();
        let updatedCount = 0;

        for (const user of users) {
             // bcrypt hashes generally start with $2a$, $2b$ or $2y$ and are 60 chars long
            if (!user.password.startsWith('$2')) {
                console.log(`Hashing password for user: ${user.email}`);
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);
                
                user.password = hashedPassword;
                await user.save();
                updatedCount++;
            }
        }

        console.log(`Finished. Updated ${updatedCount} user(s).`);
        process.exit(0);
    } catch (error) {
        console.error('Error fixing passwords:', error);
        process.exit(1);
    }
}

fixPasswords();
