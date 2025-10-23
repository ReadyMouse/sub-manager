import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export class ConfigController {
  /**
   * GET /api/config
   * Get public configuration for frontend
   */
  static async getConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          processorFeePercent: parseFloat(env.PROCESSOR_FEE_PERCENT),
          processorFeeCurrency: 'PYUSD',
          processorFeeID: '0',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
