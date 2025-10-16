import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { SubscriptionService } from '../services/subscriptionService';

export class SubscriptionController {
  /**
   * GET /api/subscriptions
   * Get all subscriptions (sent + received)
   */
  static async getAllSubscriptions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const subscriptions = await SubscriptionService.getUserSubscriptions(req.user.id);

      res.json({
        success: true,
        data: subscriptions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscriptions/sent
   * Get sent subscriptions (user is the payer)
   */
  static async getSentSubscriptions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const activeOnly = req.query.active === 'true';
      const subscriptions = await SubscriptionService.getSentSubscriptions(req.user.id, activeOnly);

      res.json({
        success: true,
        data: subscriptions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscriptions/received
   * Get received subscriptions (user is the service provider)
   */
  static async getReceivedSubscriptions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const activeOnly = req.query.active === 'true';
      const subscriptions = await SubscriptionService.getReceivedSubscriptions(req.user.id, activeOnly);

      res.json({
        success: true,
        data: subscriptions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscriptions/:id
   * Get subscription details
   */
  static async getSubscriptionById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const subscription = await SubscriptionService.getSubscriptionById(id, req.user.id);

      res.json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/subscriptions/:id/metadata
   * Update subscription metadata
   */
  static async updateMetadata(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const subscription = await SubscriptionService.updateSubscriptionMetadata(
        id,
        req.user.id,
        req.body
      );

      res.json({
        success: true,
        data: subscription,
        message: 'Subscription metadata updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscriptions/stats
   * Get subscription statistics
   */
  static async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const stats = await SubscriptionService.getUserStats(req.user.id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default SubscriptionController;

