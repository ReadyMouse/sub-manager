import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { paymentApi } from '../lib/api';

export interface Payment {
  id: string;
  subscriptionId: string;
  amount: string;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  processorFee?: string;
  netAmount?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    id: string;
    serviceName: string;
    sender?: {
      id: string;
      displayName: string;
    };
    recipient?: {
      id: string;
      displayName: string;
    };
  };
}

export const usePayments = () => {
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPayments = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await paymentApi.getAll(token);
      setPayments(response.data);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch payments'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentsBySubscription = async (subscriptionId: string) => {
    if (!token) return [];

    try {
      const response = await paymentApi.getBySubscription(subscriptionId, token);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch subscription payments:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [token]);

  return {
    payments,
    loading,
    error,
    refetch: fetchPayments,
    fetchPaymentsBySubscription,
  };
};
