import { Router } from 'express';
import { body } from 'express-validator';
import { SubscriptionController } from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All subscription routes require authentication
router.use(authenticate);

/**
 * GET /api/subscriptions
 * Get all subscriptions (sent + received)
 */
router.get('/', SubscriptionController.getAllSubscriptions);

/**
 * GET /api/subscriptions/sent
 * Get sent subscriptions
 */
router.get('/sent', SubscriptionController.getSentSubscriptions);

/**
 * GET /api/subscriptions/received
 * Get received subscriptions
 */
router.get('/received', SubscriptionController.getReceivedSubscriptions);

/**
 * GET /api/subscriptions/stats
 * Get subscription statistics
 */
router.get('/stats', SubscriptionController.getStats);

/**
 * GET /api/subscriptions/:id
 * Get subscription details
 */
router.get('/:id', SubscriptionController.getSubscriptionById);

/**
 * PUT /api/subscriptions/:id/metadata
 * Update subscription metadata (notes, tags, etc.)
 */
router.put(
  '/:id/metadata',
  validate([
    body('notes').optional().trim().isLength({ max: 1000 }),
    body('tags').optional().isArray(),
    body('tags.*').optional().trim().isLength({ max: 50 }),
    body('serviceDescription').optional().trim().isLength({ max: 500 }),
  ]),
  SubscriptionController.updateMetadata
);

export default router;

