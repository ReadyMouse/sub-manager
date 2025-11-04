import { Router } from 'express';
import { TenantScreeningController } from '../controllers/tenantScreeningController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All tenant screening routes require authentication
router.use(authenticate);

/**
 * GET /api/tenant-screening/balance/:walletAddress
 * Get wallet balance for tenant screening
 */
router.get('/balance/:walletAddress', TenantScreeningController.getWalletBalance);

/**
 * GET /api/tenant-screening/subscriptions?username=xxx
 * Get subscription history by username for tenant screening
 */
router.get('/subscriptions', TenantScreeningController.getSubscriptionsByUsername);

export default router;

