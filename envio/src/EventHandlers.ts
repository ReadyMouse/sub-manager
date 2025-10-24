/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  StableRentSubscription,
  StableRentSubscription_OwnershipTransferred,
  StableRentSubscription_PaymentFailed,
  StableRentSubscription_PaymentProcessed,
  StableRentSubscription_SubscriptionCancelled,
  StableRentSubscription_SubscriptionCreated,
} from "generated";

StableRentSubscription.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: StableRentSubscription_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.StableRentSubscription_OwnershipTransferred.set(entity);
});

StableRentSubscription.PaymentFailed.handler(async ({ event, context }) => {
  const entity: StableRentSubscription_PaymentFailed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    subscriptionId: event.params.subscriptionId,
    senderAddress: event.params.senderAddress,
    senderId: event.params.senderId,
    recipientId: event.params.recipientId,
    amount: event.params.amount,
    timestamp: event.params.timestamp,
    reason: event.params.reason,
    failedCount: event.params.failedCount,
    // Blockchain metadata
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.StableRentSubscription_PaymentFailed.set(entity);
});

StableRentSubscription.PaymentProcessed.handler(async ({ event, context }) => {
  const entity: StableRentSubscription_PaymentProcessed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    subscriptionId: event.params.subscriptionId,
    senderAddress: event.params.senderAddress,
    senderId: event.params.senderId,
    recipientId: event.params.recipientId,
    amount: event.params.amount,
    processorFee: event.params.processorFee,
    processorFeeAddress: event.params.processorFeeAddress,
    paymentCount: event.params.paymentCount,
    timestamp: event.params.timestamp,
    nextPaymentDue: event.params.nextPaymentDue,
    // Blockchain metadata
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.StableRentSubscription_PaymentProcessed.set(entity);
});

StableRentSubscription.SubscriptionCancelled.handler(async ({ event, context }) => {
  const entity: StableRentSubscription_SubscriptionCancelled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    subscriptionId: event.params.subscriptionId,
    senderAddress: event.params.senderAddress,
    senderId: event.params.senderId,
    recipientId: event.params.recipientId,
    timestamp: event.params.timestamp,
    reason: event.params.reason,
    // Blockchain metadata
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.StableRentSubscription_SubscriptionCancelled.set(entity);
});

StableRentSubscription.SubscriptionCreated.handler(async ({ event, context }) => {
  const entity: StableRentSubscription_SubscriptionCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    subscriptionId: event.params.subscriptionId,
    senderAddress: event.params.senderAddress,
    senderId: event.params.senderId,
    recipientId: event.params.recipientId,
    amount: event.params.amount,
    interval: event.params.interval,
    nextPaymentDue: event.params.nextPaymentDue,
    endDate: event.params.endDate,
    maxPayments: event.params.maxPayments,
    serviceName: event.params.serviceName,
    recipientAddress: event.params.recipientAddress,
    senderCurrency: event.params.senderCurrency,
    recipientCurrency: event.params.recipientCurrency,
    processorFee: event.params.processorFee,
    processorFeeAddress: event.params.processorFeeAddress,
    processorFeeCurrency: event.params.processorFeeCurrency,
    processorFeeID: event.params.processorFeeID,
    timestamp: event.params.timestamp,
    // Blockchain metadata
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.StableRentSubscription_SubscriptionCreated.set(entity);
});
