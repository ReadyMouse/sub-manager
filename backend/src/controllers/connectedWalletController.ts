import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ConnectedWalletService } from '../services/connectedWalletService';
import { v4 as uuidv4 } from 'uuid';

export class ConnectedWalletController {
  /**
   * GET /api/wallets
   * Get all connected wallets
   */
  static async getWallets(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const wallets = await ConnectedWalletService.getConnectedWallets(req.user.id);

      res.json({
        success: true,
        data: wallets.map(w => ({
          id: w.id,
          walletAddress: w.walletAddress,
          label: w.label,
          isPrimary: w.isPrimary,
          isVerified: w.isVerified,
          connectedAt: w.connectedAt,
          lastUsedAt: w.lastUsedAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/wallets/generate-message
   * Generate SIWE message for wallet to sign
   */
  static async generateMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { walletAddress } = req.body;

      if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
        return;
      }

      // Generate nonce
      const nonce = uuidv4();

      // Generate SIWE message
      const message = ConnectedWalletService.generateSIWEMessage(walletAddress, nonce);

      res.json({
        success: true,
        data: {
          message,
          nonce,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/wallets/connect
   * Connect and verify wallet with signature
   */
  static async connectWallet(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const wallet = await ConnectedWalletService.connectWallet(req.user.id, req.body);

      res.status(201).json({
        success: true,
        data: {
          id: wallet.id,
          walletAddress: wallet.walletAddress,
          label: wallet.label,
          isPrimary: wallet.isPrimary,
          isVerified: wallet.isVerified,
          connectedAt: wallet.connectedAt,
        },
        message: 'Wallet connected and verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/wallets/:id/primary
   * Set wallet as primary
   */
  static async setPrimary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const wallet = await ConnectedWalletService.setPrimaryWallet(req.user.id, id);

      res.json({
        success: true,
        data: wallet,
        message: 'Primary wallet updated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/wallets/:id/label
   * Update wallet label
   */
  static async updateLabel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { label } = req.body;

      const wallet = await ConnectedWalletService.updateWalletLabel(req.user.id, id, label);

      res.json({
        success: true,
        data: wallet,
        message: 'Wallet label updated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/wallets/:id
   * Disconnect wallet
   */
  static async disconnectWallet(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      await ConnectedWalletService.disconnectWallet(req.user.id, id);

      res.json({
        success: true,
        message: 'Wallet disconnected successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ConnectedWalletController;

