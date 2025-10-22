import { ethers } from 'ethers';
import prisma from '../config/database';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Automation Service for Processing Subscription Payments
 * 
 * This service replaces Gelato automation by:
 * 1. Checking for subscriptions due for payment every 6 hours
 * 2. Processing payments by calling the smart contract
 * 3. Updating database with payment results
 * 4. Handling failures and auto-cancellation logic
 */
export class AutomationService {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private isRunning = false;

  constructor() {
    // Initialize Ethereum provider
    this.provider = new ethers.JsonRpcProvider(env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID');
    
    // Initialize contract (we'll need the ABI and address)
    this.contract = new ethers.Contract(
      env.CONTRACT_ADDRESS_SEPOLIA,
      this.getContractABI(),
      this.provider
    );
  }

  /**
   * Start the automation service
   */
  start() {
    if (this.isRunning) {
      logger.warn('Automation service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting subscription payment automation service...');

    // Run immediately on start
    this.processDuePayments();

    // Schedule to run every 6 hours
    setInterval(() => {
      this.processDuePayments();
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds

    logger.info('Automation service started - checking every 6 hours');
  }

  /**
   * Stop the automation service
   */
  stop() {
    this.isRunning = false;
    logger.info('Automation service stopped');
  }

  /**
   * Process all subscriptions that are due for payment
   */
  private async processDuePayments() {
    try {
      logger.info('Checking for subscriptions due for payment...');

      // Get subscriptions due within the next 6 hours or overdue
      const now = new Date();
      const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

      const dueSubscriptions = await prisma.subscription.findMany({
        where: {
          isActive: true,
          nextPaymentDue: {
            lte: sixHoursFromNow,
          },
        },
        include: {
          sender: true,
          recipient: true,
        },
      });

      logger.info(`Found ${dueSubscriptions.length} subscriptions due for payment`);

      if (dueSubscriptions.length === 0) {
        return;
      }

      // Process each subscription
      for (const subscription of dueSubscriptions) {
        await this.processSubscriptionPayment(subscription);
      }

      logger.info('Completed processing due payments');
    } catch (error) {
      logger.error('Error processing due payments:', error);
    }
  }

  /**
   * Process payment for a single subscription
   */
  private async processSubscriptionPayment(subscription: any) {
    try {
      logger.info(`Processing payment for subscription ${subscription.id}`);

      // Check if payment is actually due (not just within 6 hours)
      const now = new Date();
      if (subscription.nextPaymentDue > now) {
        logger.info(`Subscription ${subscription.id} not yet due, skipping`);
        return;
      }

      // Check if subscription has reached max payments
      if (subscription.maxPayments && subscription.paymentCount >= subscription.maxPayments) {
        await this.cancelSubscription(subscription.id, 'expired_max_payments');
        return;
      }

      // Check if subscription has reached end date
      if (subscription.endDate && now > subscription.endDate) {
        await this.cancelSubscription(subscription.id, 'expired_end_date');
        return;
      }

      // Call smart contract to process payment
      const txHash = await this.callSmartContract(subscription);

      if (txHash) {
        // Payment successful - update database
        await this.handleSuccessfulPayment(subscription, txHash);
      } else {
        // Payment failed - handle failure
        await this.handleFailedPayment(subscription, 'Smart contract call failed');
      }
    } catch (error) {
      logger.error(`Error processing subscription ${subscription.id}:`, error);
      await this.handleFailedPayment(subscription, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Call the smart contract to process payment
   */
  private async callSmartContract(subscription: any): Promise<string | null> {
    try {
      // Check if automation private key is configured
      if (!env.PROCESSOR_PRIVATE_KEY) {
        logger.error('PROCESSOR_PRIVATE_KEY not configured - cannot process payments');
        return null;
      }

      // Create a wallet instance (we'll need a private key for the automation)
      const wallet = new ethers.Wallet(env.PROCESSOR_PRIVATE_KEY, this.provider);

      // Connect the contract to the wallet
      const contractWithSigner = this.contract.connect(wallet);

      // Call processPayment function
      const tx = await (contractWithSigner as any).processPayment(subscription.onChainId);
      
      logger.info(`Transaction submitted: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        logger.info(`Payment processed successfully for subscription ${subscription.id}`);
        return tx.hash;
      } else {
        logger.error(`Transaction failed for subscription ${subscription.id}`);
        return null;
      }
    } catch (error) {
      logger.error(`Smart contract call failed for subscription ${subscription.id}:`, error);
      return null;
    }
  }

  /**
   * Handle successful payment
   */
  private async handleSuccessfulPayment(subscription: any, txHash: string) {
    try {
      // Reset failed payment count
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          paymentCount: subscription.paymentCount + 1,
          failedPaymentCount: 0,
          nextPaymentDue: new Date(Date.now() + subscription.interval * 1000),
          lastSyncedAt: new Date(),
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          id: `${txHash}-0`, // Using txHash as base for payment ID
          subscriptionId: subscription.id,
          amount: subscription.amount,
          processorFee: subscription.processorFee,
          processorFeeAddress: subscription.processorFeeAddress,
          transactionHash: txHash,
          timestamp: new Date(),
          status: 'SUCCESS',
          senderAddress: subscription.senderWalletAddress,
          recipientAddress: subscription.recipientWalletAddress,
        },
      });

      // Create notification for sender
      await prisma.notification.create({
        data: {
          userId: subscription.senderId,
          type: 'PAYMENT_SUCCESS',
          title: 'Payment Processed',
          message: `Your payment for ${subscription.serviceName} has been processed successfully.`,
          subscriptionId: subscription.id,
        },
      });

      // Create notification for recipient
      await prisma.notification.create({
        data: {
          userId: subscription.recipientId,
          type: 'SUBSCRIPTION_RECEIVED',
          title: 'Payment Received',
          message: `You received a payment for ${subscription.serviceName}.`,
          subscriptionId: subscription.id,
        },
      });

      logger.info(`Successfully processed payment for subscription ${subscription.id}`);
    } catch (error) {
      logger.error(`Error handling successful payment for subscription ${subscription.id}:`, error);
    }
  }

  /**
   * Handle failed payment
   */
  private async handleFailedPayment(subscription: any, reason: string) {
    try {
      const newFailedCount = subscription.failedPaymentCount + 1;

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          failedPaymentCount: newFailedCount,
          lastSyncedAt: new Date(),
        },
      });

      // Create payment failure record
      await prisma.payment.create({
        data: {
          id: `failed-${Date.now()}-${subscription.id}`,
          subscriptionId: subscription.id,
          amount: subscription.amount,
          processorFee: subscription.processorFee,
          processorFeeAddress: subscription.processorFeeAddress,
          transactionHash: 'failed',
          timestamp: new Date(),
          status: 'FAILED',
          failureReason: reason,
          senderAddress: subscription.senderWalletAddress,
          recipientAddress: subscription.recipientWalletAddress,
        },
      });

      // Create notification for sender
      await prisma.notification.create({
        data: {
          userId: subscription.senderId,
          type: 'PAYMENT_FAILED',
          title: 'Payment Failed',
          message: `Your payment for ${subscription.serviceName} failed: ${reason}`,
          subscriptionId: subscription.id,
        },
      });

      // Auto-cancel after 3 consecutive failures
      if (newFailedCount >= 3) {
        await this.cancelSubscription(subscription.id, 'auto_cancelled_failures');
      }

      logger.warn(`Payment failed for subscription ${subscription.id}: ${reason}`);
    } catch (error) {
      logger.error(`Error handling failed payment for subscription ${subscription.id}:`, error);
    }
  }

  /**
   * Cancel subscription
   */
  private async cancelSubscription(subscriptionId: string, reason: string) {
    try {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          isActive: false,
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
      });

      // Get subscription for notifications
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { sender: true, recipient: true },
      });

      if (subscription) {
        // Notify sender
        await prisma.notification.create({
          data: {
            userId: subscription.senderId,
            type: 'SUBSCRIPTION_CANCELLED',
            title: 'Subscription Cancelled',
            message: `Your subscription for ${subscription.serviceName} has been cancelled: ${reason}`,
            subscriptionId: subscription.id,
          },
        });

        // Notify recipient
        await prisma.notification.create({
          data: {
            userId: subscription.recipientId,
            type: 'SUBSCRIPTION_CANCELLED',
            title: 'Subscription Cancelled',
            message: `A subscription for ${subscription.serviceName} has been cancelled: ${reason}`,
            subscriptionId: subscription.id,
          },
        });
      }

      logger.info(`Subscription ${subscriptionId} cancelled: ${reason}`);
    } catch (error) {
      logger.error(`Error cancelling subscription ${subscriptionId}:`, error);
    }
  }

  /**
   * Get contract ABI (we'll need to add this)
   */
  private getContractABI() {
    // This should be the ABI for the StableRentSubscription contract
    // We'll need to add this from the compiled contract
    return [
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "subscriptionId",
            "type": "uint256"
          }
        ],
        "name": "processPayment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ] as const;
  }

  /**
   * Get subscriptions due for payment (for manual testing)
   */
  async getDueSubscriptions() {
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    return await prisma.subscription.findMany({
      where: {
        isActive: true,
        nextPaymentDue: {
          lte: sixHoursFromNow,
        },
      },
      include: {
        sender: true,
        recipient: true,
      },
    });
  }

  /**
   * Manually trigger payment processing (for testing)
   */
  async triggerPaymentProcessing() {
    logger.info('Manually triggering payment processing...');
    await this.processDuePayments();
  }

  /**
   * Get automation service status
   */
  async getStatus() {
    const dueSubscriptions = await this.getDueSubscriptions();
    return {
      isRunning: this.isRunning,
      dueSubscriptionsCount: dueSubscriptions.length,
      lastChecked: new Date().toISOString()
    };
  }
}

export default AutomationService;
