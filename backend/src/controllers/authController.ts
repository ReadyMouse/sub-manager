import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AuthService } from '../services/authService';
import { WalletAuthService } from '../services/walletAuthService';
import { v4 as uuidv4 } from 'uuid';

export class AuthController {
  /**
   * POST /api/auth/register
   * Supports both email/password and wallet-only registration
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { walletAddress, signature, message } = req.body;

      // Wallet-only registration
      if (walletAddress && signature && message) {
        const { displayName, firstName, lastName, phoneNumber } = req.body;
        const result = await WalletAuthService.registerWithWallet(
          walletAddress,
          signature,
          message,
          displayName,
          firstName,
          lastName,
          phoneNumber
        );

        res.status(201).json({
          success: true,
          data: result,
          message: 'Wallet registered successfully. You are now signed in.',
        });
        return;
      }

      // Traditional email/password registration
      const result = await AuthService.register(req.body);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful. Please check your email to verify your account.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Supports both email/password and wallet-only login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const { walletAddress, signature, message } = req.body;

      // Wallet-only login
      if (walletAddress && signature && message) {
        const result = await WalletAuthService.loginWithWallet(
          walletAddress,
          signature,
          message,
          ipAddress,
          userAgent
        );

        res.json({
          success: true,
          data: result,
          message: 'Login successful',
        });
        return;
      }

      // Traditional email/password login
      const result = await AuthService.login(req.body, ipAddress, userAgent);

      res.json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await AuthService.logout(token);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/verify-email/:token
   */
  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      await AuthService.verifyEmail(token);

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      await AuthService.requestPasswordReset(email);

      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;

      await AuthService.resetPassword(token, password);

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  static async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const token = authHeader.substring(7);
      const user = await AuthService.verifyToken(token);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/wallet/generate-message
   * Generate SIWE message for wallet registration/login
   */
  static async generateWalletMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      const message = WalletAuthService.generateSIWEMessage(walletAddress, nonce);

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
}

export default AuthController;

