import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UserService } from '../services/userService';

export class UserController {
  /**
   * GET /api/users/me
   */
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const user = await UserService.getUserById(req.user.id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/me
   */
  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const user = await UserService.updateProfile(req.user.id, req.body);

      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/me/wallet
   */
  static async connectWallet(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const user = await UserService.connectWallet(req.user.id, req.body);

      res.json({
        success: true,
        data: user,
        message: 'Wallet connected successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/me/wallet
   */
  static async disconnectWallet(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const user = await UserService.disconnectWallet(req.user.id);

      res.json({
        success: true,
        data: user,
        message: 'Wallet disconnected successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/me/preferences
   */
  static async getPreferences(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const preferences = await UserService.getPreferences(req.user.id);

      res.json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/me/preferences
   */
  static async updatePreferences(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const preferences = await UserService.updatePreferences(req.user.id, req.body);

      res.json({
        success: true,
        data: preferences,
        message: 'Preferences updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/me/payment-addresses
   */
  static async getPaymentAddresses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const addresses = await UserService.getPaymentAddresses(req.user.id);

      res.json({
        success: true,
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/me/payment-addresses
   */
  static async addPaymentAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const address = await UserService.addPaymentAddress(req.user.id, req.body);

      res.status(201).json({
        success: true,
        data: address,
        message: 'Payment address added successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/me/payment-addresses/:addressId
   */
  static async updatePaymentAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { addressId } = req.params;
      const address = await UserService.updatePaymentAddress(req.user.id, addressId, req.body);

      res.json({
        success: true,
        data: address,
        message: 'Payment address updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/me/payment-addresses/:addressId
   */
  static async deletePaymentAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { addressId } = req.params;
      await UserService.deletePaymentAddress(req.user.id, addressId);

      res.json({
        success: true,
        message: 'Payment address deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/wallet/:walletAddress
   */
  static async getUserByWallet(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { walletAddress } = req.params;
      const user = await UserService.getUserByWallet(walletAddress);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/lookup
   * Look up recipient by email for subscription creation
   */
  static async lookupRecipient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, currency = 'PYUSD' } = req.query;

      if (!email || typeof email !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      const recipient = await UserService.lookupRecipientByEmail(email, currency as string);

      if (!recipient) {
        res.status(404).json({
          success: false,
          error: 'Recipient not found. Please check the email address.',
        });
        return;
      }

      res.json({
        success: true,
        data: recipient,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;

