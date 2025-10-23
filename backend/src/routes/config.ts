import { Router } from 'express';
import { ConfigController } from '../controllers/configController';

const router = Router();

/**
 * GET /api/config
 * Get public configuration for frontend
 */
router.get('/', ConfigController.getConfig);

export default router;
