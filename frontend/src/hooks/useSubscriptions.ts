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
  // Convert ISO date strings to Unix timestamps (seconds)
  const parseDate = (dateStr: string | undefined): number => {
    if (!dateStr) return 0;
    const timestamp = new Date(dateStr).getTime();
    return Math.floor(timestamp / 1000); // Convert ms to seconds
  };

  // Safe BigInt conversion with error handling
  const safeBigInt = (value: string | number | undefined, fieldName: string): bigint => {
    try {
      if (value === undefined || value === null || value === '') return 0n;
      // If it's already a number, convert to string first
      const strValue = typeof value === 'number' ? value.toString() : value;
      return BigInt(strValue);
    } catch (err) {
      console.error(`Failed to convert ${fieldName} to BigInt:`, value, err);
      return 0n;
    }
  };

  try {
    return {
      id: sub.id,
      subscriber: (sub.senderWalletAddress || '0x0000000000000000000000000000000000000000') as Address,
      serviceProviderId: sub.serviceName,
      serviceName: sub.serviceName, // Add serviceName for convenience
      amount: safeBigInt(sub.amount, 'amount'),
      interval: sub.interval,
      nextPaymentDue: parseDate(sub.nextPaymentDue),
      isActive: sub.isActive,
      failedPaymentCount: sub.failedPaymentCount,
      createdAt: parseDate(sub.createdAt),
      endDate: sub.endDate ? parseDate(sub.endDate) : undefined,
      maxPayments: sub.maxPayments,
      paymentCount: sub.paymentCount,
      processorFee: safeBigInt(sub.processorFee, 'processorFee'),
      processorFeeAddress: (sub.processorFeeAddress || '0x0000000000000000000000000000000000000000') as Address,
      processorFeeCurrency: sub.processorFeeCurrency || 'PYUSD',
      processorFeeID: sub.processorFeeID || '0',
      recipientAddress: (sub.recipientWalletAddress || '0x0000000000000000000000000000000000000000') as Address,
    };
  } catch (err) {
    console.error('Failed to convert subscription:', sub, err);
    throw err;
  }
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
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await subscriptionApi.getAll(token);
      const rawData = response.data as RailwaySubscriptionsResponse;
      
      // Convert Railway format to component-expected format
      const convertedData: SubscriptionsResponse = {
        sent: (rawData?.sent || []).map(convertRailwaySubscription),
        received: (rawData?.received || []).map(convertRailwaySubscription),
      };
      
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
