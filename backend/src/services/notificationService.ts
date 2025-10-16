import prisma from '../config/database';
import { CreateNotificationData } from '../types';

export class NotificationService {
  /**
   * Create a notification
   */
  static async createNotification(data: CreateNotificationData) {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any, // Type assertion for enum
        title: data.title,
        message: data.message,
        subscriptionId: data.subscriptionId,
        paymentId: data.paymentId,
        metadata: data.metadata,
        isRead: false,
      },
    });
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: string, unreadOnly = false) {
    return await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string) {
    return await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
    });
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}

export default NotificationService;

