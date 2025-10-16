import { useState, useEffect } from 'react';
import type { Address } from 'viem';
import type { EnvioSubscription, EnvioPayment, EnvioPaymentWithDirection } from '../lib/types';
// Uncomment when Envio indexer is deployed:
// import { apolloClient, handleGraphQLError } from '../lib/apollo';
// import { 
//   GET_USER_PAYMENTS, 
//   GET_USER_AS_SERVICE_PROVIDER,
//   GET_PAYMENTS_BY_SUBSCRIPTION_IDS 
// } from '../lib/envio-queries';

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
 * Hook for fetching user's payment history (sent payments only)
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
    
    // TODO: Replace with actual GraphQL query using GET_USER_PAYMENTS
  }, [userAddress]);

  return {
    payments,
    loading,
    error,
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
      // Uncomment when Envio indexer is deployed
      /*
      // 1. Fetch payments where user is subscriber (sent payments)
      const sentPaymentsResult = await apolloClient.query({
        query: GET_USER_PAYMENTS,
        variables: { userAddress: userAddress.toLowerCase() },
      });

      const sentPayments: EnvioPayment[] = sentPaymentsResult.data.payments || [];

      // 2. Fetch subscriptions where user is the service provider (to find received payments)
      const receivingSubscriptionsResult = await apolloClient.query({
        query: GET_USER_AS_SERVICE_PROVIDER,
        variables: { userAddress: userAddress.toLowerCase() },
      });

      const receivingSubscriptions: EnvioSubscription[] = receivingSubscriptionsResult.data.subscriptions || [];
      const subscriptionIds = receivingSubscriptions.map(sub => sub.id);

      // 3. Fetch payments for those subscriptions (received payments)
      let receivedPayments: EnvioPayment[] = [];
      if (subscriptionIds.length > 0) {
        const receivedPaymentsResult = await apolloClient.query({
          query: GET_PAYMENTS_BY_SUBSCRIPTION_IDS,
          variables: { subscriptionIds },
        });
        receivedPayments = receivedPaymentsResult.data.payments || [];
      }

      // 4. Combine both arrays, add direction field, and sort by timestamp
      const allPayments: EnvioPaymentWithDirection[] = [
        ...sentPayments.map(p => ({ ...p, direction: 'sent' as const })),
        ...receivedPayments.map(p => ({ ...p, direction: 'received' as const }))
      ].sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

      setPayments(allPayments);
      */

      // Mock data for development (remove when Envio is deployed)
      // Note: PYUSD has 6 decimals, so amounts are multiplied by 1,000,000
      const mockPayments: EnvioPaymentWithDirection[] = [
        {
          id: '0xabc123-1',
          subscriptionId: '1234567890',
          subscriber: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          serviceName: 'Netflix Premium',
          amount: '15490000', // $15.49 PYUSD
          processorFee: '154900', // $0.15 fee (1%)
          processorFeeAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
          timestamp: String(Math.floor(Date.now() / 1000) - 86400), // 1 day ago
          paymentNumber: '3',
          status: 'success',
          transactionHash: '0xabc123def456789012345678901234567890abcdef123456789012345678901234',
          direction: 'sent'
        },
        {
          id: '0xdef456-2',
          subscriptionId: '9876543210',
          subscriber: '0x1234567890123456789012345678901234567890',
          serviceName: 'Monthly Rent',
          amount: '2500000000', // $2,500.00 PYUSD
          processorFee: '25000000', // $25.00 fee (1%)
          processorFeeAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
          timestamp: String(Math.floor(Date.now() / 1000) - 172800), // 2 days ago
          paymentNumber: '1',
          status: 'success',
          transactionHash: '0xdef456abc789012345678901234567890abcdef123456789012345678901234',
          direction: 'received'
        },
        {
          id: '0xghi789-3',
          subscriptionId: '5555555555',
          subscriber: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          serviceName: 'Spotify Family',
          amount: '10990000', // $10.99 PYUSD
          processorFee: '109900', // $0.11 fee (1%)
          processorFeeAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
          timestamp: String(Math.floor(Date.now() / 1000) - 259200), // 3 days ago
          paymentNumber: '2',
          status: 'success',
          transactionHash: '0xghi789abc012345678901234567890abcdef123456789012345678901234',
          direction: 'sent'
        },
        {
          id: '0xjkl012-4',
          subscriptionId: '7777777777',
          subscriber: '0xabcdef1234567890abcdef1234567890abcdef12',
          serviceName: 'Property Management Fee',
          amount: '350000000', // $350.00 PYUSD
          processorFee: '3500000', // $3.50 fee (1%)
          processorFeeAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
          timestamp: String(Math.floor(Date.now() / 1000) - 345600), // 4 days ago
          paymentNumber: '5',
          status: 'success',
          transactionHash: '0xjkl012def345678901234567890abcdef123456789012345678901234',
          direction: 'received'
        },
        {
          id: '0xmno345-5',
          subscriptionId: '3333333333',
          subscriber: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          serviceName: 'Gym Membership',
          amount: '89990000', // $89.99 PYUSD
          processorFee: '899900', // $0.90 fee (1%)
          processorFeeAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
          timestamp: String(Math.floor(Date.now() / 1000) - 432000), // 5 days ago
          paymentNumber: '1',
          status: 'failed',
          transactionHash: '0xmno345abc678901234567890abcdef123456789012345678901234',
          direction: 'sent'
        },
        {
          id: '0xpqr678-6',
          subscriptionId: '9999999999',
          subscriber: '0xfedcba0987654321fedcba0987654321fedcba09',
          serviceName: 'Office Rent',
          amount: '1200000000', // $1,200.00 PYUSD
          processorFee: '12000000', // $12.00 fee (1%)
          processorFeeAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
          timestamp: String(Math.floor(Date.now() / 1000) - 518400), // 6 days ago
          paymentNumber: '2',
          status: 'success',
          transactionHash: '0xpqr678def901234567890abcdef123456789012345678901234',
          direction: 'received'
        }
      ];
      
      setPayments(mockPayments);
      
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      // Uncomment when Envio is deployed: const errorMessage = handleGraphQLError(err);
      setError(new Error('Failed to fetch payments'));
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

