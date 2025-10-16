import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';
import { webhookLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to webhook endpoints
router.use(webhookLimiter);

/**
 * POST /api/webhooks/subscription-created
 * Handle subscription created event from Envio
 */
router.post('/subscription-created', WebhookController.subscriptionCreated);

/**
 * POST /api/webhooks/payment-processed
 * Handle payment processed event from Envio
 */
router.post('/payment-processed', WebhookController.paymentProcessed);

/**
 * POST /api/webhooks/payment-failed
 * Handle payment failed event from Envio
 */
router.post('/payment-failed', WebhookController.paymentFailed);

/**
 * POST /api/webhooks/subscription-cancelled
 * Handle subscription cancelled event from Envio
 */
router.post('/subscription-cancelled', WebhookController.subscriptionCancelled);

export default router;

