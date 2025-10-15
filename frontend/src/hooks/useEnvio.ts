import { useState, useEffect } from 'react';
import type { Address } from 'viem';
import type { EnvioSubscription, EnvioPayment } from '../lib/types';

// Note: These hooks use mock data until Envio indexer is deployed
// Replace with Apollo Client when Envio is configured

/**
 * Hook for fetching user's subscriptions from Envio
 */
export const useEnvioUserSubscriptions = (userAddress: Address | undefined) => {
  const [subscriptions] = useState<EnvioSubscription[]>([]);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  const refetch = () => {
    // Placeholder for refetch logic
    console.log('Refetch subscriptions for:', userAddress);
  };

  useEffect(() => {
    if (!userAddress) {
      return;
    }
    
    // TODO: Replace with actual GraphQL query when Envio is deployed
  }, [userAddress]);

  return {
    subscriptions,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for fetching payment history for a subscription
 */
export const useEnvioPaymentHistory = (subscriptionId: string | undefined) => {
  const [payments] = useState<EnvioPayment[]>([]);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  const refetch = () => {
    console.log('Refetch payment history for:', subscriptionId);
  };

  useEffect(() => {
    if (!subscriptionId) {
      return;
    }
    
    // TODO: Replace with actual GraphQL query
  }, [subscriptionId]);

  return {
    payments,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for fetching all subscriptions (for marketplace/dashboard)
 */
export const useEnvioAllSubscriptions = () => {
  const [subscriptions] = useState<EnvioSubscription[]>([]);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  const refetch = () => {
    console.log('Refetch all subscriptions');
  };

  useEffect(() => {
    // TODO: Replace with actual GraphQL query
  }, []);

  return {
    subscriptions,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for fetching user's payment history
 */
export const useEnvioUserPayments = (userAddress: Address | undefined) => {
  const [payments] = useState<EnvioPayment[]>([]);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  const refetch = () => {
    console.log('Refetch user payments for:', userAddress);
  };

  useEffect(() => {
    if (!userAddress) {
      return;
    }
    
    // TODO: Replace with actual GraphQL query
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
  };
};

