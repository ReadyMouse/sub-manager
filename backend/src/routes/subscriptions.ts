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
    body('recipientId').optional({ nullable: true }).isString(), // Optional - can be null for wallet-only recipients
    body('serviceName').isString().notEmpty(),
    body('amount').isString().notEmpty(),
    body('interval').isInt({ min: 1 }),
    body('nextPaymentDue').isISO8601(),
    body('endDate').optional({ nullable: true }).isISO8601(),
    body('maxPayments').optional({ nullable: true }).isInt({ min: 1 }),
    body('senderWalletAddress').optional({ nullable: true }).isString(),
    body('recipientWalletAddress').optional({ nullable: true }).isString(),
    body('senderCurrency').optional({ nullable: true }).isString(),
    body('recipientCurrency').optional({ nullable: true }).isString(),
    body('processorFee').optional({ nullable: true }).isString(),
    body('processorFeeAddress').optional({ nullable: true }).isString(),
    body('processorFeeCurrency').optional({ nullable: true }).isString(),
    body('processorFeeID').optional({ nullable: true }).isString(),
    body('metadata.notes').optional({ nullable: true }).isString().isLength({ max: 1000 }),
    body('metadata.tags').optional({ nullable: true }).isArray(),
    body('metadata.serviceDescription').optional({ nullable: true }).isString().isLength({ max: 500 }),
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

