import AutomationService from './automationService';
import { logger } from '../utils/logger';

/**
 * Startup Service
 * 
 * Handles initialization of background services when the application starts
 */
export class StartupService {
  private automationService: AutomationService;

  constructor() {
    this.automationService = new AutomationService();
  }

  /**
   * Initialize all background services
   */
  async initialize() {
    try {
      logger.info('Initializing background services...');

      // Start automation service
      this.automationService.start();

      logger.info('All background services initialized successfully');
    } catch (error) {
      logger.error('Error initializing background services:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown of all services
   */
  async shutdown() {
    try {
      logger.info('Shutting down background services...');

      // Stop automation service
      this.automationService.stop();

      logger.info('All background services shut down successfully');
    } catch (error) {
      logger.error('Error shutting down background services:', error);
    }
  }
}

export default StartupService;
