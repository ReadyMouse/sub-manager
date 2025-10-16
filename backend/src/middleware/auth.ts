import { Response, NextFunction } from 'express';
import { AuthRequest, UnauthorizedError } from '../types';
import { AuthService } from '../services/authService';

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token and get user
    const user = await AuthService.verifyToken(token);

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress || undefined,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await AuthService.verifyToken(token);

      req.user = {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress || undefined,
      };
    }

    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

/**
 * Require wallet to be connected
 */
export const requireWallet = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user?.walletAddress) {
    next(new UnauthorizedError('Wallet connection required'));
    return;
  }
  next();
};

