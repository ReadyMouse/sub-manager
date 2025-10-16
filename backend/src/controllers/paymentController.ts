import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { SubscriptionService } from '../services/subscriptionService';

export class PaymentController {
  /**
   * GET /api/payments
   * Get all payments (sent + received)
   */
  static async getAllPayments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const payments = await SubscriptionService.getUserPayments(req.user.id, limit);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/sent
   * Get sent payments
   */
  static async getSentPayments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const payments = await SubscriptionService.getSentPayments(req.user.id, limit);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/received
   * Get received payments
   */
  static async getReceivedPayments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const payments = await SubscriptionService.getReceivedPayments(req.user.id, limit);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default PaymentController;

