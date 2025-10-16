import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * GET /api/notifications
 * Get user notifications
 */
router.get('/', NotificationController.getNotifications);

/**
 * GET /api/notifications/count
 * Get unread notification count
 */
router.get('/count', NotificationController.getUnreadCount);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', NotificationController.markAllAsRead);

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', NotificationController.markAsRead);

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id', NotificationController.deleteNotification);

export default router;

