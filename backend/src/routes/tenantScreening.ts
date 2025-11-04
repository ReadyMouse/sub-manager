import { Router } from 'express';
import { TenantScreeningController } from '../controllers/tenantScreeningController';

const router = Router();

// Tenant screening routes are public - no authentication required
// This allows property owners to screen potential tenants without requiring them to have an account

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

