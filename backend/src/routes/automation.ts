import { Router } from 'express';
import AutomationController from '../controllers/automationController';

const router = Router();
const automationController = new AutomationController();

// Automation routes are for system administration - no authentication required

/**
 * @route GET /automation/status
 * @desc Get automation service status
 * @access Private
 */
router.get('/status', automationController.getStatus);

/**
 * @route GET /automation/due-subscriptions
 * @desc Get subscriptions due for payment
 * @access Private
 */
router.get('/due-subscriptions', automationController.getDueSubscriptions);

/**
 * @route POST /automation/start
 * @desc Start the automation service
 * @access Private
 */
router.post('/start', automationController.startAutomation);

/**
 * @route POST /automation/stop
 * @desc Stop the automation service
 * @access Private
 */
router.post('/stop', automationController.stopAutomation);

/**
 * @route POST /automation/trigger
 * @desc Manually trigger payment processing
 * @access Private
 */
router.post('/trigger', automationController.triggerPaymentProcessing);

export default router;
