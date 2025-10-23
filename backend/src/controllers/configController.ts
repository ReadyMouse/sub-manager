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
          processorFeeAddress: env.PROCESSOR_FEE_ADDRESS,
          processorFeeCurrency: env.PROCESSOR_FEE_CURRENCY,
          processorFeeID: env.PROCESSOR_FEE_ID,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
