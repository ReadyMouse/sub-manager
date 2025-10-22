import { Request, Response } from 'express';
import AutomationService from '../services/automationService';
import { logger } from '../utils/logger';

export class AutomationController {
  private automationService: AutomationService;

  constructor() {
    this.automationService = new AutomationService();
  }

  /**
   * Start the automation service
   */
  startAutomation = async (_req: Request, res: Response) => {
    try {
      this.automationService.start();
      res.json({ 
        success: true, 
        message: 'Automation service started successfully' 
      });
    } catch (error) {
      logger.error('Error starting automation service:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to start automation service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Stop the automation service
   */
  stopAutomation = async (_req: Request, res: Response) => {
    try {
      this.automationService.stop();
      res.json({ 
        success: true, 
        message: 'Automation service stopped successfully' 
      });
    } catch (error) {
      logger.error('Error stopping automation service:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to stop automation service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get subscriptions due for payment
   */
  getDueSubscriptions = async (_req: Request, res: Response) => {
    try {
      const dueSubscriptions = await this.automationService.getDueSubscriptions();
      res.json({ 
        success: true, 
        data: dueSubscriptions,
        count: dueSubscriptions.length 
      });
    } catch (error) {
      logger.error('Error getting due subscriptions:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get due subscriptions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Manually trigger payment processing
   */
  triggerPaymentProcessing = async (_req: Request, res: Response) => {
    try {
      await this.automationService.triggerPaymentProcessing();
      res.json({ 
        success: true, 
        message: 'Payment processing triggered successfully' 
      });
    } catch (error) {
      logger.error('Error triggering payment processing:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to trigger payment processing',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get automation service status
   */
  getStatus = async (_req: Request, res: Response) => {
    try {
      const status = await this.automationService.getStatus();
      res.json({ 
        success: true, 
        data: status
      });
    } catch (error) {
      logger.error('Error getting automation status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get automation status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export default AutomationController;
