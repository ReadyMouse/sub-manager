import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { NotificationService } from '../services/notificationService';

export class NotificationController {
  /**
   * GET /api/notifications
   * Get user notifications
   */
  static async getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const unreadOnly = req.query.unread === 'true';
      const notifications = await NotificationService.getUserNotifications(req.user.id, unreadOnly);

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/count
   * Get unread notification count
   */
  static async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const count = await NotificationService.getUnreadCount(req.user.id);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/:id/read
   * Mark notification as read
   */
  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      await NotificationService.markAsRead(id, req.user.id);

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/read-all
   * Mark all notifications as read
   */
  static async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await NotificationService.markAllAsRead(req.user.id);

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Delete notification
   */
  static async deleteNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      await NotificationService.deleteNotification(id, req.user.id);

      res.json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;

