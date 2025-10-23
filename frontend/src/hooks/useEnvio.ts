import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import type { Address } from 'viem';
import type { EnvioSubscription, EnvioPayment, EnvioPaymentWithDirection } from '../lib/types';
import { apolloClient, handleGraphQLError } from '../lib/apollo';
import {
  GET_USER_SUBSCRIPTIONS,
  GET_ALL_SUBSCRIPTIONS,
  GET_USER_PAYMENTS,
  GET_USER_AS_SERVICE_PROVIDER,
  GET_PAYMENTS_BY_SUBSCRIPTION_IDS,
  GET_SUBSCRIPTION_PAYMENTS,
} from '../lib/envio-queries';

// Note: These hooks use mock data until Envio indexer is deployed
// Replace with Apollo Client when Envio is configured

/**
 * Hook for fetching user's subscriptions from Envio
 */
export const useEnvioUserSubscriptions = (userAddress: Address | undefined) => {
  const { data, loading, error, refetch } = useQuery(GET_USER_SUBSCRIPTIONS, {
    variables: { userAddress: userAddress?.toLowerCase() },
    skip: !userAddress,
    errorPolicy: 'all',
  });

  return {
    subscriptions: data?.subscriptions || [],
    loading,
    error: error ? new Error(handleGraphQLError(error)) : null,
    refetch,
  };
};

/**
 * Hook for fetching payment history for a subscription
 */
export const useEnvioPaymentHistory = (subscriptionId: string | undefined) => {
  const { data, loading, error, refetch } = useQuery(GET_SUBSCRIPTION_PAYMENTS, {
    variables: { subscriptionId },
    skip: !subscriptionId,
    errorPolicy: 'all',
  });

  return {
    payments: data?.payments || [],
    loading,
    error: error ? new Error(handleGraphQLError(error)) : null,
    refetch,
  };
};

/**
 * Hook for fetching all subscriptions (for marketplace/dashboard)
 */
export const useEnvioAllSubscriptions = () => {
  const { data, loading, error, refetch } = useQuery(GET_ALL_SUBSCRIPTIONS, {
    errorPolicy: 'all',
  });

  return {
    subscriptions: data?.subscriptions || [],
    loading,
    error: error ? new Error(handleGraphQLError(error)) : null,
    refetch,
  };
};

/**
 * Hook for fetching user's payment history (sent payments only)
 */
export const useEnvioUserPayments = (userAddress: Address | undefined) => {
  const { data, loading, error, refetch } = useQuery(GET_USER_PAYMENTS, {
    variables: { userAddress: userAddress?.toLowerCase() },
    skip: !userAddress,
    errorPolicy: 'all',
  });

  return {
    payments: data?.payments || [],
    loading,
    error: error ? new Error(handleGraphQLError(error)) : null,
    refetch,
  };
};

/**
 * Hook for fetching ALL user payment history (both sent and received)
 * This checks both subscriber field (sent) and recipientAddress field (received)
 */
export const useEnvioAllUserPayments = (userAddress: Address | undefined) => {
  const [payments, setPayments] = useState<EnvioPaymentWithDirection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllPayments = async () => {
    if (!userAddress) {
      setPayments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch payments where user is subscriber (sent payments)
      const sentPaymentsResult = await apolloClient.query({
        query: GET_USER_PAYMENTS,
        variables: { userAddress: userAddress.toLowerCase() },
      });

      const sentPayments: EnvioPayment[] = (sentPaymentsResult.data as any)?.payments || [];

      // 2. Fetch subscriptions where user is the service provider (to find received payments)
      const receivingSubscriptionsResult = await apolloClient.query({
        query: GET_USER_AS_SERVICE_PROVIDER,
        variables: { userAddress: userAddress.toLowerCase() },
      });

      const receivingSubscriptions: EnvioSubscription[] = (receivingSubscriptionsResult.data as any)?.subscriptions || [];
      const subscriptionIds = receivingSubscriptions.map(sub => sub.id);

      // 3. Fetch payments for those subscriptions (received payments)
      let receivedPayments: EnvioPayment[] = [];
      if (subscriptionIds.length > 0) {
        const receivedPaymentsResult = await apolloClient.query({
          query: GET_PAYMENTS_BY_SUBSCRIPTION_IDS,
          variables: { subscriptionIds },
        });
        receivedPayments = (receivedPaymentsResult.data as any)?.payments || [];
      }

      // 4. Combine both arrays, add direction field, and sort by timestamp
      const allPayments: EnvioPaymentWithDirection[] = [
        ...sentPayments.map(p => ({ ...p, direction: 'sent' as const })),
        ...receivedPayments.map(p => ({ ...p, direction: 'received' as const }))
      ].sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

      setPayments(allPayments);
      
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      const errorMessage = handleGraphQLError(err);
      setError(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchAllPayments();
  };

  useEffect(() => {
    fetchAllPayments();
  }, [userAddress]);

  return {
    payments,
    loading,
    error,
    refetch,
  };
};

/**
 * Helper to convert Envio subscription to typed subscription
 */
export const parseEnvioSubscription = (envioSub: EnvioSubscription) => {
  return {
    id: envioSub.id,
    subscriber: envioSub.subscriber as Address,
    serviceProviderId: envioSub.serviceProviderId,
    amount: BigInt(envioSub.amount),
    interval: parseInt(envioSub.interval),
    nextPaymentDue: parseInt(envioSub.nextPaymentDue),
    isActive: envioSub.isActive,
    failedPaymentCount: parseInt(envioSub.failedPaymentCount),
    createdAt: parseInt(envioSub.createdAt),
    endDate: envioSub.endDate ? parseInt(envioSub.endDate) : undefined,
    maxPayments: envioSub.maxPayments ? parseInt(envioSub.maxPayments) : undefined,
    paymentCount: parseInt(envioSub.paymentCount),
    processorFee: BigInt(envioSub.processorFee),
    processorFeeAddress: envioSub.processorFeeAddress as Address,
    processorFeeCurrency: envioSub.processorFeeCurrency,
    processorFeeID: envioSub.processorFeeID,
  };
};

/**
 * Helper to convert Envio payment to typed payment
 */
export const parseEnvioPayment = (envioPayment: EnvioPayment) => {
  return {
    id: envioPayment.id,
    subscriptionId: envioPayment.subscriptionId,
    amount: BigInt(envioPayment.amount),
    processorFee: BigInt(envioPayment.processorFee),
    processorFeeAddress: envioPayment.processorFeeAddress as Address,
    timestamp: parseInt(envioPayment.timestamp),
    status: envioPayment.status,
    transactionHash: envioPayment.transactionHash,
    reason: envioPayment.reason,
  };
};

