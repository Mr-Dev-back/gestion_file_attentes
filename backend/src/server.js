import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { sequelize } from './config/database.js';
import { redisClient } from './config/redis.js';
import logger from './config/logger.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import quaiRoutes from './routes/quaiRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import siteRoutes from './routes/siteRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import systemSettingRoutes from './routes/systemSettingRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import kioskRoutes from './routes/kioskRoutes.js';
import publicDisplayRoutes from './routes/publicDisplayRoutes.js';
import roleRoutes from './routes/role.routes.js';
import permissionRoutes from './routes/permission.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import auditRoutes from './routes/audit.routes.js';
import { apiLimiter, authLimiter } from './middlewares/rateLimiter.js';
import cleanupService from './services/cleanupService.js';
import authMiddleware from './middlewares/auth.middleware.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configuration Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8081',
    methods: ['GET', 'POST']
  }
});

// Middleware d'authentification Socket.io
io.use(authMiddleware.authenticateSocket);

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8081',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/', apiLimiter); // Appliquer le rate limiting à toutes les routes API

// Rendre io accessible dans les routes
app.set('io', io);

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: 'checking...',
      redis: redisClient.isOpen ? 'connected' : 'disconnected'
    }
  });
});

// Health check endpoint (also available under /api for frontend)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: 'checking...',
      redis: redisClient.isOpen ? 'connected' : 'disconnected'
    }
  });
});

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/quais', quaiRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', systemSettingRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/kiosks', kioskRoutes);
app.use('/api/public/display', publicDisplayRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((err, req, res, _next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Socket.io events
io.on('connection', (socket) => {
  const { user } = socket;
  logger.info(`Client connecté: ${socket.id} (User: ${user.username}, Role: ${user.role})`);

  // Rejoindre automatiquement la room du site de l'utilisateur
  const siteId = user.siteId || socket.handshake.query.siteId || socket.handshake.auth.siteId;
  
  if (siteId) {
    socket.join(`site_${siteId}`);
    logger.info(`Client ${socket.id} (${user.role}) a rejoint le site: ${siteId}`);
  }

  // Rejoindre une room de file d'attente spécifique (sur demande)
  socket.on('join-queue', (queueId) => {
    // Vérification basique: l'utilisateur doit être du même site que la file (ou admin)
    // Pour l'instant on laisse rejoindre, mais on log
    socket.join(`queue_${queueId}`);
    logger.info(`Client ${socket.id} a rejoint la file: ${queueId}`);
  });

  socket.on('disconnect', (reason) => {
    logger.info(`Client déconnecté: ${socket.id} (${reason})`);
  });
});

// Démarrage du serveur
const PORT = process.env.BACKEND_PORT || 3000;
const isTestEnvironment = process.env.NODE_ENV === 'test';

async function startServer() {
  try {
    // Test connexion DB
    await sequelize.authenticate();
    logger.info('Connexion PostgreSQL établie');

    // Sync des models (en dev uniquement)
    // Sync des models (en dev uniquement)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false }); 
      logger.info('Models synchronisés (alter: false)');
    }

    // Test connexion Redis & Adapter Socket.io
    try {
      await redisClient.connect();
      const subClient = redisClient.duplicate();
      await subClient.connect();
      io.adapter(createAdapter(redisClient, subClient));
      logger.info('Connexion Redis et Adapter Socket.io établis');
    } catch (redisError) {
      logger.warn('Impossible de se connecter à Redis. Le serveur continuera sans broker WebSocket.');
      logger.error(redisError.message);
    }

    // Démarrage du serveur
    logger.info(`Tentative de démarrage sur le port: ${PORT}`);
    server.listen(PORT, () => {
      logger.info(`Serveur démarré sur le port ${PORT}`);
      logger.info(`Environnement: ${process.env.NODE_ENV}`);

      // Démarrer les services d'arrière-plan
      cleanupService.start();
    }).on('error', (err) => {
      logger.error('Erreur server.listen:', err);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Erreur de démarrage:', error);
    process.exit(1);
  }
}

if (!isTestEnvironment) {
  startServer();
}

// Gestion de l'arrêt gracieux
process.on('SIGTERM', async () => {
  logger.info('SIGTERM reçu, arrêt gracieux...');
  await sequelize.close();
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
  server.close(() => {
    logger.info('Serveur arrêté');
    process.exit(0);
  });
});

export { app, io, server, startServer };
