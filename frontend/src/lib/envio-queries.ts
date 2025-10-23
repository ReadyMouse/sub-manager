import { gql } from '@apollo/client/index.js';

/**
 * GraphQL Queries for Envio Indexer
 * 
 * These queries fetch raw event data from Envio. We process and aggregate them in the frontend.
 */

// Query: Get all subscription events for a user
export const GET_USER_SUBSCRIPTIONS = gql`
  query GetUserSubscriptions($userAddress: String!) {
    stableRentSubscription_SubscriptionCreateds(
      where: { senderAddress_contains_nocase: $userAddress }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      subscriptionId
      senderAddress
      senderId
      recipientId
      amount
      interval
      nextPaymentDue
      endDate
      maxPayments
      serviceName
      recipientAddress
      senderCurrency
      recipientCurrency
      processorFee
      processorFeeAddress
      processorFeeCurrency
      processorFeeID
      timestamp
    }
    stableRentSubscription_SubscriptionCancelleds(
      where: { senderAddress_contains_nocase: $userAddress }
    ) {
      id
      subscriptionId
      senderAddress
      timestamp
      reason
    }
  }
`;

// Query: Get all subscriptions (for admin/marketplace)
export const GET_ALL_SUBSCRIPTIONS = gql`
  query GetAllSubscriptions {
    stableRentSubscription_SubscriptionCreateds(
      orderBy: timestamp
      orderDirection: desc
      first: 100
    ) {
      id
      subscriptionId
      senderAddress
      senderId
      recipientId
      amount
      interval
      nextPaymentDue
      endDate
      maxPayments
      serviceName
      recipientAddress
      senderCurrency
      recipientCurrency
      processorFee
      processorFeeAddress
      processorFeeCurrency
      processorFeeID
      timestamp
    }
    stableRentSubscription_SubscriptionCancelleds {
      id
      subscriptionId
      senderAddress
      timestamp
      reason
    }
  }
`;

// Query: Get payment events for a user
export const GET_USER_PAYMENTS = gql`
  query GetUserPayments($userAddress: String!) {
    stableRentSubscription_PaymentProcesseds(
      where: { senderAddress_contains_nocase: $userAddress }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      subscriptionId
      senderAddress
      amount
      processorFee
      processorFeeAddress
      paymentCount
      timestamp
      nextPaymentDue
    }
  }
`;

// Query: Get subscriptions where user is the service provider
export const GET_USER_AS_SERVICE_PROVIDER = gql`
  query GetUserAsServiceProvider($userAddress: String!) {
    stableRentSubscription_SubscriptionCreateds(
      where: { recipientAddress_contains_nocase: $userAddress }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      subscriptionId
      senderAddress
      senderId
      recipientId
      amount
      interval
      nextPaymentDue
      endDate
      maxPayments
      serviceName
      recipientAddress
      senderCurrency
      recipientCurrency
      processorFee
      processorFeeAddress
      processorFeeCurrency
      processorFeeID
      timestamp
    }
  }
`;

// Query: Get payments by subscription IDs
export const GET_PAYMENTS_BY_SUBSCRIPTION_IDS = gql`
  query GetPaymentsBySubscriptionIds($subscriptionIds: [BigInt!]!) {
    stableRentSubscription_PaymentProcesseds(
      where: { subscriptionId_in: $subscriptionIds }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      subscriptionId
      senderAddress
      amount
      processorFee
      processorFeeAddress
      paymentCount
      timestamp
      nextPaymentDue
    }
  }
`;

// Query: Get payment events for a specific subscription
export const GET_SUBSCRIPTION_PAYMENTS = gql`
  query GetSubscriptionPayments($subscriptionId: BigInt!) {
    stableRentSubscription_PaymentProcesseds(
      where: { subscriptionId: $subscriptionId }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      subscriptionId
      senderAddress
      amount
      processorFee
      processorFeeAddress
      paymentCount
      timestamp
      nextPaymentDue
    }
  }
`;

// Not used by current frontend, but keeping for compatibility
export const GET_USER_ACTIVE_SUBSCRIPTIONS = GET_USER_SUBSCRIPTIONS;
export const GET_SUBSCRIPTION = GET_USER_SUBSCRIPTIONS;
export const GET_FAILED_PAYMENTS = GET_USER_PAYMENTS;
export const GET_SUBSCRIPTIONS_DUE = GET_ALL_SUBSCRIPTIONS;
export const GET_USER_STATS = GET_USER_SUBSCRIPTIONS;
export const GET_PROCESSOR_FEE_STATS = GET_ALL_SUBSCRIPTIONS;
export const SEARCH_SUBSCRIPTIONS = GET_ALL_SUBSCRIPTIONS;
