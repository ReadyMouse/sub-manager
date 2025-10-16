import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

/**
 * POST /api/auth/register
 * Register a new user (email/password OR wallet-only)
 */
router.post(
  '/register',
  validate([
    // Email/password fields (optional if wallet provided)
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    
    // Wallet fields (optional if email provided)
    body('walletAddress').optional().matches(/^0x[a-fA-F0-9]{40}$/),
    body('signature').optional().isString(),
    body('message').optional().isString(),
    
    // Common fields
    body('displayName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Display name must be between 2 and 50 characters'),
    body('userType')
      .optional()
      .isIn(['REGULAR', 'ADMIN'])
      .withMessage('Invalid user type'),
    body('firstName').optional().trim().isLength({ max: 50 }),
    body('lastName').optional().trim().isLength({ max: 50 }),
    body('phoneNumber').optional().trim().isMobilePhone('any'),
  ]),
  AuthController.register
);

/**
 * POST /api/auth/login
 * Login with email/password OR wallet
 */
router.post(
  '/login',
  validate([
    // Email/password (optional if wallet provided)
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isString(),
    
    // Wallet (optional if email provided)
    body('walletAddress').optional().matches(/^0x[a-fA-F0-9]{40}$/),
    body('signature').optional().isString(),
    body('message').optional().isString(),
  ]),
  AuthController.login
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * POST /api/auth/logout
 * Logout user (invalidate session)
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * GET /api/auth/verify-email/:token
 * Verify email address
 */
router.get('/verify-email/:token', AuthController.verifyEmail);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ]),
  AuthController.forgotPassword
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
  ]),
  AuthController.resetPassword
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', AuthController.getCurrentUser);

/**
 * POST /api/auth/wallet/generate-message
 * Generate SIWE message for wallet registration/login
 */
router.post(
  '/wallet/generate-message',
  validate([
    body('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ]),
  AuthController.generateWalletMessage
);

export default router;

