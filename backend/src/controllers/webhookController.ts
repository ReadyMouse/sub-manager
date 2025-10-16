import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { WebhookService } from '../services/webhookService';

export class WebhookController {
  /**
   * Verify Envio webhook signature
   */
  private static verifySignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', env.ENVIO_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * POST /api/webhooks/subscription-created
   */
  static async subscriptionCreated(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Verify signature
      const signature = req.headers['x-envio-signature'] as string;
      const payload = JSON.stringify(req.body);

      if (!signature || !WebhookController.verifySignature(payload, signature)) {
        res.status(401).json({
          success: false,
          error: 'Invalid signature',
        });
        return;
      }

      await WebhookService.handleSubscriptionCreated(req.body);

      res.json({
        success: true,
        message: 'Subscription created event processed',
      });
    } catch (error) {
      console.error('Webhook error (subscription-created):', error);
      next(error);
    }
  }

  /**
   * POST /api/webhooks/payment-processed
   */
  static async paymentProcessed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-envio-signature'] as string;
      const payload = JSON.stringify(req.body);

      if (!signature || !WebhookController.verifySignature(payload, signature)) {
        res.status(401).json({
          success: false,
          error: 'Invalid signature',
        });
        return;
      }

      const txHash = req.body.transactionHash || 'unknown';
      await WebhookService.handlePaymentProcessed(req.body, txHash);

      res.json({
        success: true,
        message: 'Payment processed event handled',
      });
    } catch (error) {
      console.error('Webhook error (payment-processed):', error);
      next(error);
    }
  }

  /**
   * POST /api/webhooks/payment-failed
   */
  static async paymentFailed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-envio-signature'] as string;
      const payload = JSON.stringify(req.body);

      if (!signature || !WebhookController.verifySignature(payload, signature)) {
        res.status(401).json({
          success: false,
          error: 'Invalid signature',
        });
        return;
      }

      const txHash = req.body.transactionHash || 'unknown';
      await WebhookService.handlePaymentFailed(req.body, txHash);

      res.json({
        success: true,
        message: 'Payment failed event handled',
      });
    } catch (error) {
      console.error('Webhook error (payment-failed):', error);
      next(error);
    }
  }

  /**
   * POST /api/webhooks/subscription-cancelled
   */
  static async subscriptionCancelled(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-envio-signature'] as string;
      const payload = JSON.stringify(req.body);

      if (!signature || !WebhookController.verifySignature(payload, signature)) {
        res.status(401).json({
          success: false,
          error: 'Invalid signature',
        });
        return;
      }

      await WebhookService.handleSubscriptionCancelled(req.body);

      res.json({
        success: true,
        message: 'Subscription cancelled event handled',
      });
    } catch (error) {
      console.error('Webhook error (subscription-cancelled):', error);
      next(error);
    }
  }
}

export default WebhookController;

