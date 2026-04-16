const imports = [
    'dotenv',
    'express',
    'cors',
    'helmet',
    'morgan',
    'http',
    'cookie-parser',
    'socket.io',
    './src/config/database.js',
    './src/config/redis.js',
    './src/config/logger.js',
    './src/config/swagger.js',
    './src/routes/auth.routes.js',
    './src/routes/user.routes.js',
    './src/routes/ticketRoutes.js',
    './src/routes/companyRoutes.js',
    './src/routes/siteRoutes.js',
    './src/routes/categoryRoutes.js',
    './src/routes/dashboard.routes.js',
    './src/routes/systemSettingRoutes.js',
    './src/routes/workflowRoutes.js',
    './src/routes/queueRoutes.js',
    './src/routes/kioskRoutes.js',
    './src/routes/publicDisplayRoutes.js',
    './src/middlewares/rateLimiter.js',
    './src/services/cleanupService.js',
    './src/middlewares/auth.middleware.js'
];

async function run() {
    for (const m of imports) {
        console.log(`Importing ${m}...`);
        try {
            await import(m);
            console.log(`Imported ${m}`);
        } catch (e) {
            console.error(`Failed to import ${m}:`, e);
            process.exit(1);
        }
    }
    console.log('All imports successful');
    process.exit(0);
}

run();
