import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionApi } from '../lib/api';
import type { Subscription as SubscriptionType } from '../lib/types';
import type { Address } from 'viem';

// Railway Postgres Subscription format (raw from API)
export interface RailwaySubscription {
  id: string;
  chainId: number;
  onChainId: string;
  senderId: string;
  recipientId: string;
  serviceName: string;
  serviceDescription?: string;
  amount: string;
  interval: number;
  nextPaymentDue: string;
  endDate?: string;
  maxPayments?: number;
  paymentCount: number;
  failedPaymentCount: number;
  isActive: boolean;
  processorFee?: string;
  processorFeeAddress?: string;
  processorFeeCurrency?: string;
  processorFeeID?: string;
  syncStatus: string;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    displayName: string;
    email?: string;
  };
  recipient?: {
    id: string;
    displayName: string;
    email?: string;
  };
  senderWalletAddress?: string;
  recipientWalletAddress?: string;
}

// Helper to convert Railway subscription to the Subscription type expected by components
export const convertRailwaySubscription = (sub: RailwaySubscription): SubscriptionType & { serviceName: string } => {
  return {
    id: sub.id,
    subscriber: (sub.senderWalletAddress || '0x0000000000000000000000000000000000000000') as Address,
    serviceProviderId: sub.serviceName,
    serviceName: sub.serviceName, // Add serviceName for convenience
    amount: BigInt(sub.amount || '0'),
    interval: sub.interval,
    nextPaymentDue: parseInt(sub.nextPaymentDue),
    isActive: sub.isActive,
    failedPaymentCount: sub.failedPaymentCount,
    createdAt: parseInt(sub.createdAt),
    endDate: sub.endDate ? parseInt(sub.endDate) : undefined,
    maxPayments: sub.maxPayments,
    paymentCount: sub.paymentCount,
    processorFee: BigInt(sub.processorFee || '0'),
    processorFeeAddress: (sub.processorFeeAddress || '0x0000000000000000000000000000000000000000') as Address,
    processorFeeCurrency: sub.processorFeeCurrency || 'PYUSD',
    processorFeeID: sub.processorFeeID || '0',
    recipientAddress: (sub.recipientWalletAddress || '0x0000000000000000000000000000000000000000') as Address,
  };
};

export interface SubscriptionsResponse {
  sent: (SubscriptionType & { serviceName: string })[];
  received: (SubscriptionType & { serviceName: string })[];
}

interface RailwaySubscriptionsResponse {
  sent: RailwaySubscription[];
  received: RailwaySubscription[];
}

export const useSubscriptions = () => {
  const { token } = useAuth();
  const [subscriptions, setSubscriptions] = useState<SubscriptionsResponse>({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscriptions = async () => {
    if (!token) {
      console.log('[useSubscriptions] No token available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[useSubscriptions] Fetching subscriptions...');
      const response = await subscriptionApi.getAll(token);
      console.log('[useSubscriptions] API response:', response);
      const rawData = response.data as RailwaySubscriptionsResponse;
      console.log('[useSubscriptions] Raw data:', rawData);
      console.log('[useSubscriptions] Sent count:', rawData?.sent?.length || 0);
      console.log('[useSubscriptions] Received count:', rawData?.received?.length || 0);
      
      // Convert Railway format to component-expected format
      const convertedData: SubscriptionsResponse = {
        sent: (rawData?.sent || []).map(convertRailwaySubscription),
        received: (rawData?.received || []).map(convertRailwaySubscription),
      };
      
      console.log('[useSubscriptions] Converted data:', convertedData);
      setSubscriptions(convertedData);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch subscriptions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [token]);

  return {
    subscriptions,
    loading,
    error,
    refetch: fetchSubscriptions,
  };
};
