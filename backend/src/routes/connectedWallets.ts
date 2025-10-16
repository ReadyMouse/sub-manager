import { Router } from 'express';
import { body } from 'express-validator';
import { ConnectedWalletController } from '../controllers/connectedWalletController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All wallet routes require authentication
router.use(authenticate);

/**
 * GET /api/wallets
 * Get all connected wallets
 */
router.get('/', ConnectedWalletController.getWallets);

/**
 * POST /api/wallets/generate-message
 * Generate SIWE message for wallet to sign
 */
router.post(
  '/generate-message',
  validate([
    body('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ]),
  ConnectedWalletController.generateMessage
);

/**
 * POST /api/wallets/connect
 * Connect and verify wallet with signature
 */
router.post(
  '/connect',
  validate([
    body('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    body('signature').notEmpty().withMessage('Signature is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('label').optional().trim().isLength({ max: 100 }),
  ]),
  ConnectedWalletController.connectWallet
);

/**
 * PUT /api/wallets/:id/primary
 * Set wallet as primary
 */
router.put('/:id/primary', ConnectedWalletController.setPrimary);

/**
 * PUT /api/wallets/:id/label
 * Update wallet label
 */
router.put(
  '/:id/label',
  validate([
    body('label').trim().isLength({ min: 1, max: 100 }).withMessage('Label is required'),
  ]),
  ConnectedWalletController.updateLabel
);

/**
 * DELETE /api/wallets/:id
 * Disconnect wallet
 */
router.delete('/:id', ConnectedWalletController.disconnectWallet);

export default router;

