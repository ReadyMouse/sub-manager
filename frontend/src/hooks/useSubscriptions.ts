import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionApi } from '../lib/api';

export interface Subscription {
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
}

export interface SubscriptionsResponse {
  sent: Subscription[];
  received: Subscription[];
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
      setSubscriptions(response.data);
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
