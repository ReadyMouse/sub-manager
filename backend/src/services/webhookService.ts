import prisma from '../config/database';
import {
  SubscriptionCreatedEvent,
  PaymentProcessedEvent,
  PaymentFailedEvent,
  SubscriptionCancelledEvent,
} from '../types';
import { NotificationService } from './notificationService';

export class WebhookService {
  /**
   * Handle SubscriptionCreated event from Envio
   */
  static async handleSubscriptionCreated(event: SubscriptionCreatedEvent): Promise<void> {
    const {
      subscriptionId,
      senderAddress,
      senderId,
      recipientId,
      amount,
      interval,
      nextPaymentDue,
      endDate,
      maxPayments,
      serviceName,
      recipientAddress,
      senderCurrency,
      recipientCurrency,
      processorFee,
      processorFeeAddress,
      processorFeeCurrency,
      processorFeeID,
      timestamp,
    } = event;

    // Convert timestamp to Date
    const createdAt = new Date(parseInt(timestamp) * 1000);
    const nextPaymentDate = new Date(parseInt(nextPaymentDue) * 1000);
    const endDateObj = endDate && parseInt(endDate) > 0 ? new Date(parseInt(endDate) * 1000) : undefined;

    // Find or create sender
    let sender = await prisma.user.findUnique({
      where: { id: senderId },
    });

    if (!sender) {
      // Try to find by wallet address via ConnectedWallet
      const wallet = await prisma.connectedWallet.findFirst({
        where: { walletAddress: senderAddress.toLowerCase() },
        include: { user: true },
      });
      sender = wallet?.user || null;
    }

    // Find or create recipient
    let recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      // Try to find by payment address
      const paymentAddress = await prisma.paymentAddress.findFirst({
        where: { address: recipientAddress.toLowerCase() },
        include: { user: true },
      });

      if (paymentAddress) {
        recipient = paymentAddress.user;
      }
    }

    // Get recipient's payment address record if exists
    const recipientPaymentAddress = recipient
      ? await prisma.paymentAddress.findFirst({
          where: {
            userId: recipient.id,
            address: recipientAddress.toLowerCase(),
          },
        })
      : null;

    // Create or update subscription
    const subscriptionKey = `1:${subscriptionId}`; // chainId:onChainId

    await prisma.subscription.upsert({
      where: { id: subscriptionKey },
      create: {
        id: subscriptionKey,
        chainId: 1,
        onChainId: subscriptionId,
        senderId: sender?.id || senderId,
        senderWalletAddress: senderAddress.toLowerCase(),
        senderCurrency,
        recipientId: recipient?.id || recipientId,
        recipientWalletAddress: recipientAddress.toLowerCase(),
        recipientCurrency,
        recipientPaymentAddressId: recipientPaymentAddress?.id,
        serviceName,
        amount,
        interval: parseInt(interval),
        nextPaymentDue: nextPaymentDate,
        endDate: endDateObj,
        maxPayments: maxPayments ? parseInt(maxPayments) : undefined,
        paymentCount: 0,
        failedPaymentCount: 0,
        isActive: true,
        processorFee,
        processorFeeAddress,
        processorFeeCurrency,
        processorFeeID,
        syncStatus: 'SYNCED',
        lastSyncedAt: new Date(),
        createdAt,
      },
      update: {
        serviceName,
        amount,
        interval: parseInt(interval),
        nextPaymentDue: nextPaymentDate,
        endDate: endDateObj,
        maxPayments: maxPayments ? parseInt(maxPayments) : undefined,
        processorFee,
        processorFeeAddress,
        processorFeeCurrency,
        processorFeeID,
        lastSyncedAt: new Date(),
      },
    });

    // Send notifications
    if (sender) {
      await NotificationService.createNotification({
        userId: sender.id,
        type: 'SUBSCRIPTION_CREATED',
        title: 'Subscription Created',
        message: `Your subscription to ${serviceName} has been created successfully.`,
        subscriptionId: subscriptionKey,
      });
    }

    if (recipient) {
      await NotificationService.createNotification({
        userId: recipient.id,
        type: 'SUBSCRIPTION_RECEIVED',
        title: 'New Subscription',
        message: `You have a new subscription for ${serviceName}.`,
        subscriptionId: subscriptionKey,
      });
    }
  }

  /**
   * Handle PaymentProcessed event from Envio
   */
  static async handlePaymentProcessed(event: PaymentProcessedEvent, txHash: string): Promise<void> {
    const {
      subscriptionId,
      senderAddress,
      amount,
      processorFee,
      processorFeeAddress,
      paymentCount,
      timestamp,
      nextPaymentDue,
    } = event;

    const subscriptionKey = `1:${subscriptionId}`;
    const paymentTimestamp = new Date(parseInt(timestamp) * 1000);
    const nextPaymentDate = new Date(parseInt(nextPaymentDue) * 1000);

    // Update subscription
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionKey },
      data: {
        paymentCount: parseInt(paymentCount),
        nextPaymentDue: nextPaymentDate,
        failedPaymentCount: 0, // Reset on successful payment
        lastSyncedAt: new Date(),
      },
      include: {
        sender: true,
        recipient: true,
      },
    });

    // Create payment record
    const paymentId = `${txHash}-${subscriptionId}`;
    await prisma.payment.create({
      data: {
        id: paymentId,
        subscriptionId: subscriptionKey,
        amount,
        processorFee,
        processorFeeAddress,
        transactionHash: txHash,
        timestamp: paymentTimestamp,
        status: 'SUCCESS',
        senderAddress: senderAddress.toLowerCase(),
        recipientAddress: subscription.recipientWalletAddress,
      },
    });

    // Send notifications
    if (subscription.sender) {
      await NotificationService.createNotification({
        userId: subscription.sender.id,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Processed',
        message: `Your payment for ${subscription.serviceName} has been processed successfully.`,
        subscriptionId: subscriptionKey,
        paymentId,
      });
    }

    if (subscription.recipient) {
      await NotificationService.createNotification({
        userId: subscription.recipient.id,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Received',
        message: `You received a payment for ${subscription.serviceName}.`,
        subscriptionId: subscriptionKey,
        paymentId,
      });
    }
  }

  /**
   * Handle PaymentFailed event from Envio
   */
  static async handlePaymentFailed(event: PaymentFailedEvent, txHash: string): Promise<void> {
    const {
      subscriptionId,
      senderAddress,
      amount,
      timestamp,
      reason,
      failedCount,
    } = event;

    const subscriptionKey = `1:${subscriptionId}`;
    const paymentTimestamp = new Date(parseInt(timestamp) * 1000);

    // Update subscription
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionKey },
      data: {
        failedPaymentCount: parseInt(failedCount),
        lastSyncedAt: new Date(),
      },
      include: {
        sender: true,
        recipient: true,
      },
    });

    // Create failed payment record
    const paymentId = `${txHash}-${subscriptionId}-failed`;
    await prisma.payment.create({
      data: {
        id: paymentId,
        subscriptionId: subscriptionKey,
        amount,
        processorFee: '0',
        transactionHash: txHash,
        timestamp: paymentTimestamp,
        status: 'FAILED',
        failureReason: reason,
        senderAddress: senderAddress.toLowerCase(),
        recipientAddress: subscription.recipientWalletAddress,
      },
    });

    // Send notification to sender
    if (subscription.sender) {
      await NotificationService.createNotification({
        userId: subscription.sender.id,
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        message: `Your payment for ${subscription.serviceName} failed: ${reason}`,
        subscriptionId: subscriptionKey,
        paymentId,
        metadata: { reason, failedCount },
      });
    }

    // If 3 failed payments, send warning
    if (parseInt(failedCount) >= 3 && subscription.sender) {
      await NotificationService.createNotification({
        userId: subscription.sender.id,
        type: 'SUBSCRIPTION_CANCELLED',
        title: 'Subscription Auto-Cancelled',
        message: `Your subscription to ${subscription.serviceName} has been cancelled due to multiple payment failures.`,
        subscriptionId: subscriptionKey,
      });
    }
  }

  /**
   * Handle SubscriptionCancelled event from Envio
   */
  static async handleSubscriptionCancelled(event: SubscriptionCancelledEvent): Promise<void> {
    const {
      subscriptionId,
      timestamp,
      reason,
    } = event;

    const subscriptionKey = `1:${subscriptionId}`;
    const cancelledAt = new Date(parseInt(timestamp) * 1000);

    // Update subscription
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionKey },
      data: {
        isActive: false,
        cancelledAt,
        cancellationReason: reason,
        lastSyncedAt: new Date(),
      },
      include: {
        sender: true,
        recipient: true,
      },
    });

    // Send notifications
    if (subscription.sender) {
      await NotificationService.createNotification({
        userId: subscription.sender.id,
        type: 'SUBSCRIPTION_CANCELLED',
        title: 'Subscription Cancelled',
        message: `Your subscription to ${subscription.serviceName} has been cancelled.`,
        subscriptionId: subscriptionKey,
        metadata: { reason },
      });
    }

    if (subscription.recipient) {
      await NotificationService.createNotification({
        userId: subscription.recipient.id,
        type: 'SUBSCRIPTION_CANCELLED',
        title: 'Subscription Cancelled',
        message: `A subscription for ${subscription.serviceName} has been cancelled.`,
        subscriptionId: subscriptionKey,
        metadata: { reason },
      });
    }
  }
}

export default WebhookService;

