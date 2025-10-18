import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', UserController.getProfile);

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put(
  '/me',
  validate([
    body('displayName').optional().trim().isLength({ min: 2, max: 50 }),
    body('firstName').optional().trim().isLength({ max: 50 }),
    body('lastName').optional().trim().isLength({ max: 50 }),
    body('phoneNumber').optional().trim().isMobilePhone('any'),
  ]),
  UserController.updateProfile
);

/**
 * POST /api/users/me/wallet
 * Connect wallet to account
 */
router.post(
  '/me/wallet',
  validate([
    body('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    body('signature').optional().isString(),
  ]),
  UserController.connectWallet
);

/**
 * DELETE /api/users/me/wallet
 * Disconnect wallet from account
 */
router.delete('/me/wallet', UserController.disconnectWallet);

/**
 * GET /api/users/me/preferences
 * Get user preferences
 */
router.get('/me/preferences', UserController.getPreferences);

/**
 * PUT /api/users/me/preferences
 * Update user preferences
 */
router.put(
  '/me/preferences',
  validate([
    body('emailNotifications').optional().isBoolean(),
    body('paymentReminders').optional().isBoolean(),
    body('lowBalanceWarnings').optional().isBoolean(),
    body('marketingEmails').optional().isBoolean(),
    body('reminderDaysBefore').optional().isInt({ min: 1, max: 30 }),
    body('defaultCurrency').optional().isString().isLength({ max: 10 }),
    body('timezone').optional().isString(),
    body('language').optional().isString().isLength({ max: 10 }),
  ]),
  UserController.updatePreferences
);

/**
 * GET /api/users/me/payment-addresses
 * Get all payment addresses
 */
router.get('/me/payment-addresses', UserController.getPaymentAddresses);

/**
 * POST /api/users/me/payment-addresses
 * Add a new payment address
 */
router.post(
  '/me/payment-addresses',
  validate([
    body('address').notEmpty().withMessage('Address is required'),
    body('currency').notEmpty().isLength({ max: 10 }).withMessage('Currency is required'),
    body('label').optional().trim().isLength({ max: 100 }),
    body('addressType')
      .isIn(['WALLET', 'CUSTODIAL', 'EXCHANGE'])
      .withMessage('Invalid address type'),
    body('isDefault').optional().isBoolean(),
  ]),
  UserController.addPaymentAddress
);

/**
 * PUT /api/users/me/payment-addresses/:addressId
 * Update a payment address
 */
router.put(
  '/me/payment-addresses/:addressId',
  validate([
    body('label').optional().trim().isLength({ max: 100 }),
    body('isDefault').optional().isBoolean(),
    body('isActive').optional().isBoolean(),
  ]),
  UserController.updatePaymentAddress
);

/**
 * DELETE /api/users/me/payment-addresses/:addressId
 * Delete a payment address
 */
router.delete('/me/payment-addresses/:addressId', UserController.deletePaymentAddress);

/**
 * GET /api/users/wallet/:walletAddress
 * Get user by wallet address (public endpoint for looking up users)
 */
router.get('/wallet/:walletAddress', UserController.getUserByWallet);

/**
 * GET /api/users/lookup?email=xxx&currency=PYUSD
 * Look up recipient by email for subscription creation
 */
router.get('/lookup', UserController.lookupRecipient);

export default router;

