import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authMiddleware.authenticate);

/**
 * Admin Dashboard Routes
 */
router.get('/admin/stats',
    authMiddleware.authorize(['ADMINISTRATOR']),
    dashboardController.getAdminStats
);

router.get('/admin/recent-activity',
    authMiddleware.authorize(['ADMINISTRATOR']),
    dashboardController.getAdminRecentActivity
);

router.get('/admin/overview',
    authMiddleware.authorize(['ADMINISTRATOR']),
    dashboardController.getAdminOverview
);

/**
 * Supervisor Dashboard Routes
 */
router.get('/supervisor/stats',
    authMiddleware.authorize(['SUPERVISOR', 'ADMINISTRATOR']),
    dashboardController.getSupervisorStats
);

router.get('/supervisor/departments',
    authMiddleware.authorize(['SUPERVISOR', 'ADMINISTRATOR']),
    dashboardController.getSupervisorDepartments
);

router.get('/supervisor/queues',
    authMiddleware.authorize(['SUPERVISOR', 'ADMINISTRATOR', 'MANAGER']),
    dashboardController.getSupervisorQueues
);

/**
 * Manager Dashboard Routes
 */
router.get('/manager/stats',
    authMiddleware.authorize(['MANAGER', 'SUPERVISOR', 'ADMINISTRATOR']),
    dashboardController.getManagerStats
);

router.get('/manager/performance',
    authMiddleware.authorize(['MANAGER', 'SUPERVISOR', 'ADMINISTRATOR']),
    dashboardController.getManagerPerformance
);

router.get('/manager/distribution',
    authMiddleware.authorize(['MANAGER', 'SUPERVISOR', 'ADMINISTRATOR']),
    dashboardController.getManagerDistribution
);

router.get('/manager/site-comparison',
    authMiddleware.authorize(['MANAGER', 'SUPERVISOR', 'ADMINISTRATOR']),
    dashboardController.getManagerSiteComparison
);

router.get('/manager/map-stats',
    authMiddleware.authorize(['MANAGER', 'SUPERVISOR', 'ADMINISTRATOR']),
    dashboardController.getMapStats
);

/**
 * Sales Dashboard Routes
 */
router.get('/sales/stats',
    authMiddleware.authorize(['AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR']),
    dashboardController.getSalesStats
);

router.get('/sales/summary',
    authMiddleware.authorize(['AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR']),
    dashboardController.getSalesSummary
);

/**
 * Control Dashboard Routes
 */
router.get('/control/stats',
    authMiddleware.authorize(['AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR']),
    dashboardController.getControlStats
);

router.get('/control/pending',
    authMiddleware.authorize(['AGENT_QUAI', 'SUPERVISOR', 'ADMINISTRATOR']),
    dashboardController.getControlPending
);

export default router;
