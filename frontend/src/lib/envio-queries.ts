import { gql } from '@apollo/client/index.js';

/**
 * GraphQL Queries for Envio Indexer
 * 
 * These queries are used to fetch subscription and payment data
 * from the Envio indexer's GraphQL endpoint.
 */

// Fragment for subscription fields
export const SUBSCRIPTION_FIELDS = gql`
  fragment SubscriptionFields on Subscription {
    id
    subscriber
    serviceProviderId
    amount
    interval
    nextPaymentDue
    endDate
    maxPayments
    serviceName
    paymentType
    providerType
    recipientAddress
    recipientCurrency
    processorFee
    processorFeeAddress
    processorFeeCurrency
    processorFeeID
    createdAt
    isActive
    paymentCount
    failedPaymentCount
    lastPaymentTime
    lastFailedPayment
    cancelledAt
    cancellationReason
  }
`;

// Fragment for payment fields
export const PAYMENT_FIELDS = gql`
  fragment PaymentFields on Payment {
    id
    subscriptionId
    subscriber
    serviceName
    amount
    processorFee
    processorFeeAddress
    timestamp
    paymentNumber
    status
    transactionHash
  }
`;

// Query: Get all subscriptions for a user
export const GET_USER_SUBSCRIPTIONS = gql`
  ${SUBSCRIPTION_FIELDS}
  query GetUserSubscriptions($userAddress: String!) {
    subscriptions(
      where: { subscriber: $userAddress }
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...SubscriptionFields
    }
  }
`;

// Query: Get active subscriptions for a user
export const GET_USER_ACTIVE_SUBSCRIPTIONS = gql`
  ${SUBSCRIPTION_FIELDS}
  query GetUserActiveSubscriptions($userAddress: String!) {
    subscriptions(
      where: { 
        subscriber: $userAddress
        isActive: true
      }
      orderBy: nextPaymentDue
      orderDirection: asc
    ) {
      ...SubscriptionFields
    }
  }
`;

// Query: Get a specific subscription by ID
export const GET_SUBSCRIPTION = gql`
  ${SUBSCRIPTION_FIELDS}
  query GetSubscription($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      ...SubscriptionFields
    }
  }
`;

// Query: Get all subscriptions (for marketplace/dashboard)
export const GET_ALL_SUBSCRIPTIONS = gql`
  ${SUBSCRIPTION_FIELDS}
  query GetAllSubscriptions(
    $first: Int = 100
    $skip: Int = 0
    $orderBy: String = "createdAt"
    $orderDirection: String = "desc"
  ) {
    subscriptions(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      ...SubscriptionFields
    }
  }
`;

// Query: Get payments for a subscription
export const GET_SUBSCRIPTION_PAYMENTS = gql`
  ${PAYMENT_FIELDS}
  query GetSubscriptionPayments($subscriptionId: String!) {
    payments(
      where: { subscriptionId: $subscriptionId }
      orderBy: timestamp
      orderDirection: desc
    ) {
      ...PaymentFields
    }
  }
`;

// Query: Get all payments for a user (sent payments)
export const GET_USER_PAYMENTS = gql`
  ${PAYMENT_FIELDS}
  query GetUserPayments($userAddress: String!) {
    payments(
      where: { subscriber: $userAddress }
      orderBy: timestamp
      orderDirection: desc
    ) {
      ...PaymentFields
    }
  }
`;

// Query: Get subscriptions where user is the service provider (to find received payments)
export const GET_USER_AS_SERVICE_PROVIDER = gql`
  ${SUBSCRIPTION_FIELDS}
  query GetUserAsServiceProvider($userAddress: String!) {
    subscriptions(
      where: { recipientAddress: $userAddress }
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...SubscriptionFields
    }
  }
`;

// Query: Get all payments for multiple subscription IDs (for received payments)
export const GET_PAYMENTS_BY_SUBSCRIPTION_IDS = gql`
  ${PAYMENT_FIELDS}
  query GetPaymentsBySubscriptionIds($subscriptionIds: [String!]!) {
    payments(
      where: { subscriptionId_in: $subscriptionIds }
      orderBy: timestamp
      orderDirection: desc
    ) {
      ...PaymentFields
    }
  }
`;

// Query: Get failed payments for a subscription
export const GET_FAILED_PAYMENTS = gql`
  query GetFailedPayments($subscriptionId: String!) {
    failedPayments(
      where: { subscriptionId: $subscriptionId }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      subscriptionId
      subscriber
      amount
      timestamp
      reason
      failedCount
    }
  }
`;

// Query: Get subscriptions due for payment
export const GET_SUBSCRIPTIONS_DUE = gql`
  ${SUBSCRIPTION_FIELDS}
  query GetSubscriptionsDue($currentTimestamp: String!) {
    subscriptions(
      where: {
        isActive: true
        nextPaymentDue_lte: $currentTimestamp
      }
      orderBy: nextPaymentDue
      orderDirection: asc
    ) {
      ...SubscriptionFields
    }
  }
`;

// Query: Get subscription statistics for a user
export const GET_USER_STATS = gql`
  query GetUserStats($userAddress: String!) {
    subscriptions(where: { subscriber: $userAddress }) {
      id
      amount
      processorFee
      isActive
      paymentCount
      failedPaymentCount
    }
    payments(where: { subscriber: $userAddress }) {
      id
      amount
      processorFee
    }
  }
`;

// Query: Get processor fee statistics
export const GET_PROCESSOR_FEE_STATS = gql`
  query GetProcessorFeeStats($processorAddress: String!) {
    payments(where: { processorFeeAddress: $processorAddress }) {
      id
      processorFee
      timestamp
    }
    subscriptions(where: { processorFeeAddress: $processorAddress }) {
      id
      processorFee
      isActive
      paymentCount
    }
  }
`;

// Query: Search subscriptions by service name
export const SEARCH_SUBSCRIPTIONS = gql`
  ${SUBSCRIPTION_FIELDS}
  query SearchSubscriptions($searchTerm: String!) {
    subscriptions(
      where: { serviceName_contains: $searchTerm }
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...SubscriptionFields
    }
  }
`;

/**
 * Subscription (WebSocket) for real-time updates
 */

// Subscribe to new subscriptions
export const SUBSCRIBE_NEW_SUBSCRIPTIONS = gql`
  ${SUBSCRIPTION_FIELDS}
  subscription OnNewSubscription($userAddress: String!) {
    subscriptionCreated(where: { subscriber: $userAddress }) {
      ...SubscriptionFields
    }
  }
`;

// Subscribe to payment events
export const SUBSCRIBE_PAYMENTS = gql`
  ${PAYMENT_FIELDS}
  subscription OnPaymentProcessed($userAddress: String!) {
    paymentProcessed(where: { subscriber: $userAddress }) {
      ...PaymentFields
    }
  }
`;

// Subscribe to subscription cancellations
export const SUBSCRIBE_CANCELLATIONS = gql`
  subscription OnSubscriptionCancelled($userAddress: String!) {
    subscriptionCancelled(where: { subscriber: $userAddress }) {
      id
      cancelledAt
      cancellationReason
    }
  }
`;

