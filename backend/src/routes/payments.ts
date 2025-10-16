import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

/**
 * GET /api/payments
 * Get all payments (sent + received)
 */
router.get('/', PaymentController.getAllPayments);

/**
 * GET /api/payments/sent
 * Get sent payments
 */
router.get('/sent', PaymentController.getSentPayments);

/**
 * GET /api/payments/received
 * Get received payments
 */
router.get('/received', PaymentController.getReceivedPayments);

export default router;

