import { gql } from '@apollo/client/index.js';

/**
 * GraphQL Queries for Envio Indexer
 * 
 * These queries fetch raw event data from Envio. We process and aggregate them in the frontend.
 */

// Query: Get all subscription events for a user
export const GET_USER_SUBSCRIPTIONS = gql`
  query GetUserSubscriptions($userAddress: String!) {
    StableRentSubscription_SubscriptionCreated(
      where: { senderAddress: { _ilike: $userAddress } }
      order_by: { id: desc }
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
    }
    StableRentSubscription_SubscriptionCancelled(
      where: { senderAddress: { _ilike: $userAddress } }
      order_by: { id: desc }
    ) {
      id
      subscriptionId
      senderAddress
      reason
    }
  }
`;

// Query: Get all subscriptions (for admin/marketplace)
export const GET_ALL_SUBSCRIPTIONS = gql`
  query GetAllSubscriptions {
    StableRentSubscription_SubscriptionCreated(
      order_by: { id: desc }
      limit: 100
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
    }
    StableRentSubscription_SubscriptionCancelled(
      order_by: { id: desc }
      limit: 100
    ) {
      id
      subscriptionId
      senderAddress
      reason
    }
  }
`;

// Query: Get payment events for a user
export const GET_USER_PAYMENTS = gql`
  query GetUserPayments($userAddress: String!) {
    StableRentSubscription_PaymentProcessed(
      where: { senderAddress: { _ilike: $userAddress } }
      order_by: { id: desc }
    ) {
      id
      subscriptionId
      senderAddress
      amount
      processorFee
      processorFeeAddress
      paymentCount
      nextPaymentDue
    }
  }
`;

// Query: Get subscriptions where user is the service provider
export const GET_USER_AS_SERVICE_PROVIDER = gql`
  query GetUserAsServiceProvider($userAddress: String!) {
    StableRentSubscription_SubscriptionCreated(
      where: { recipientAddress: { _ilike: $userAddress } }
      order_by: { id: desc }
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
    }
  }
`;

// Query: Get payments by subscription IDs
export const GET_PAYMENTS_BY_SUBSCRIPTION_IDS = gql`
  query GetPaymentsBySubscriptionIds($subscriptionIds: [String!]!) {
    StableRentSubscription_PaymentProcessed(
      where: { subscriptionId: { _in: $subscriptionIds } }
      order_by: { id: desc }
    ) {
      id
      subscriptionId
      senderAddress
      amount
      processorFee
      processorFeeAddress
      paymentCount
      nextPaymentDue
    }
  }
`;

// Query: Get payment events for a specific subscription
export const GET_SUBSCRIPTION_PAYMENTS = gql`
  query GetSubscriptionPayments($subscriptionId: String!) {
    StableRentSubscription_PaymentProcessed(
      where: { subscriptionId: { _eq: $subscriptionId } }
      order_by: { id: desc }
    ) {
      id
      subscriptionId
      senderAddress
      amount
      processorFee
      processorFeeAddress
      paymentCount
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
