import prisma from '../config/database';
import { NotFoundError, ForbiddenError } from '../types';

export class SubscriptionService {
  /**
   * Get all subscriptions for a user (sent + received)
   */
  static async getUserSubscriptions(userId: string) {
    const [sent, received] = await Promise.all([
      prisma.subscription.findMany({
        where: { senderId: userId },
        include: {
          recipient: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.findMany({
        where: { recipientId: userId },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { sent, received };
  }

  /**
   * Get sent subscriptions (user is the payer)
   */
  static async getSentSubscriptions(userId: string, activeOnly = false) {
    return await prisma.subscription.findMany({
      where: {
        senderId: userId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: {
        recipient: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get received subscriptions (user is the service provider)
   */
  static async getReceivedSubscriptions(userId: string, activeOnly = false) {
    return await prisma.subscription.findMany({
      where: {
        recipientId: userId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get subscription by ID
   */
  static async getSubscriptionById(subscriptionId: string, userId?: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        recipient: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        payments: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    // If userId provided, check access
    if (userId && subscription.senderId !== userId && subscription.recipientId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return subscription;
  }

  /**
   * Create a new subscription record in the database
   */
  static async createSubscriptionRecord(
    chainId: number,
    onChainId: string,
    senderId: string,
    recipientId: string,
    serviceName: string,
    amount: string,
    interval: number,
    nextPaymentDue: Date,
    endDate?: Date,
    maxPayments?: number,
    senderWalletAddress?: string,
    recipientWalletAddress?: string,
    senderCurrency?: string,
    recipientCurrency?: string,
    processorFee?: string,
    processorFeeAddress?: string,
    processorFeeCurrency?: string,
    processorFeeID?: string,
    metadata?: {
      notes?: string;
      tags?: string[];
      serviceDescription?: string;
    }
  ) {
    const subscriptionKey = `${chainId}:${onChainId}`;
    
    return await prisma.subscription.create({
      data: {
        id: subscriptionKey,
        chainId,
        onChainId,
        senderId,
        recipientId,
        serviceName,
        amount,
        interval,
        nextPaymentDue,
        endDate,
        maxPayments,
        paymentCount: 0,
        failedPaymentCount: 0,
        isActive: true,
        syncStatus: 'PENDING', // Will be updated when Envio processes it
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        // Optional fields
        senderWalletAddress: senderWalletAddress?.toLowerCase() || undefined,
        recipientWalletAddress: recipientWalletAddress?.toLowerCase() || undefined,
        senderCurrency,
        recipientCurrency,
        processorFee,
        processorFeeAddress,
        processorFeeCurrency,
        processorFeeID,
        // Metadata
        notes: metadata?.notes,
        tags: metadata?.tags,
        serviceDescription: metadata?.serviceDescription,
      },
    });
  }

  /**
   * Update subscription metadata (notes, tags, etc.)
   */
  static async updateSubscriptionMetadata(
    subscriptionId: string,
    userId: string,
    data: {
      notes?: string;
      tags?: string[];
      serviceDescription?: string;
    }
  ) {
    // Verify user owns the subscription (either sender or recipient)
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    if (subscription.senderId !== userId && subscription.recipientId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        notes: data.notes,
        tags: data.tags,
        serviceDescription: data.serviceDescription,
      },
    });
  }

  /**
   * Get payment history for a user
   */
  static async getUserPayments(userId: string, limit = 50) {
    // Get user's subscriptions
    const { sent, received } = await this.getUserSubscriptions(userId);
    const subscriptionIds = [
      ...sent.map((s) => s.id),
      ...received.map((s) => s.id),
    ];

    // Get payments for these subscriptions
    const payments = await prisma.payment.findMany({
      where: {
        subscriptionId: { in: subscriptionIds },
      },
      include: {
        subscription: {
          select: {
            serviceName: true,
            senderId: true,
            recipientId: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    // Categorize as sent or received
    return payments.map((payment) => ({
      ...payment,
      direction:
        payment.subscription.senderId === userId ? ('sent' as const) : ('received' as const),
    }));
  }

  /**
   * Get sent payments
   */
  static async getSentPayments(userId: string, limit = 50) {
    const subscriptions = await this.getSentSubscriptions(userId);
    const subscriptionIds = subscriptions.map((s) => s.id);

    return await prisma.payment.findMany({
      where: {
        subscriptionId: { in: subscriptionIds },
      },
      include: {
        subscription: {
          select: {
            serviceName: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get received payments
   */
  static async getReceivedPayments(userId: string, limit = 50) {
    const subscriptions = await this.getReceivedSubscriptions(userId);
    const subscriptionIds = subscriptions.map((s) => s.id);

    return await prisma.payment.findMany({
      where: {
        subscriptionId: { in: subscriptionIds },
      },
      include: {
        subscription: {
          select: {
            serviceName: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get subscription statistics for a user
   */
  static async getUserStats(userId: string) {
    const [sent, received] = await Promise.all([
      this.getSentSubscriptions(userId),
      this.getReceivedSubscriptions(userId),
    ]);

    const activeSent = sent.filter((s) => s.isActive).length;
    const activeReceived = received.filter((s) => s.isActive).length;

    // Calculate total monthly spend (approximate)
    const monthlySpend = sent
      .filter((s) => s.isActive)
      .reduce((total, sub) => {
        const monthlyAmount = (BigInt(sub.amount) * BigInt(2592000)) / BigInt(sub.interval);
        return total + monthlyAmount;
      }, BigInt(0));

    // Calculate total monthly revenue (approximate)
    const monthlyRevenue = received
      .filter((s) => s.isActive)
      .reduce((total, sub) => {
        const monthlyAmount = (BigInt(sub.amount) * BigInt(2592000)) / BigInt(sub.interval);
        return total + monthlyAmount;
      }, BigInt(0));

    return {
      totalSubscriptionsSent: sent.length,
      totalSubscriptionsReceived: received.length,
      activeSubscriptionsSent: activeSent,
      activeSubscriptionsReceived: activeReceived,
      estimatedMonthlySpend: monthlySpend.toString(),
      estimatedMonthlyRevenue: monthlyRevenue.toString(),
    };
  }
}

export default SubscriptionService;

