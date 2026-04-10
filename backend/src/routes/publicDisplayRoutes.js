import express from 'express';
import publicDisplayController from '../controllers/publicDisplayController.js';

const router = express.Router();

/**
 * @route GET /api/public/display/:siteId
 * @desc Get data for public display screen (Read-only, high performance)
 * @access Public
 */
router.get('/sites', publicDisplayController.getSites);
router.get('/:siteId', publicDisplayController.getDisplayData);

export default router;
