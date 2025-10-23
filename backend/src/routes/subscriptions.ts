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
 * POST /api/subscriptions
 * Create a new subscription record
 */
router.post(
  '/',
  validate([
    body('chainId').isInt({ min: 1 }),
    body('onChainId').isString().notEmpty(),
    body('recipientId').isString().notEmpty(),
    body('serviceName').isString().notEmpty(),
    body('amount').isString().notEmpty(),
    body('interval').isInt({ min: 1 }),
    body('nextPaymentDue').isISO8601(),
    body('endDate').optional().isISO8601(),
    body('maxPayments').optional().isInt({ min: 1 }),
    body('senderWalletAddress').optional().isString(),
    body('recipientWalletAddress').optional().isString(),
    body('senderCurrency').optional().isString(),
    body('recipientCurrency').optional().isString(),
    body('processorFee').optional().isString(),
    body('processorFeeAddress').optional().isString(),
    body('processorFeeCurrency').optional().isString(),
    body('processorFeeID').optional().isString(),
    body('metadata.notes').optional().isString().isLength({ max: 1000 }),
    body('metadata.tags').optional().isArray(),
    body('metadata.serviceDescription').optional().isString().isLength({ max: 500 }),
  ]),
  SubscriptionController.createSubscription
);

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

