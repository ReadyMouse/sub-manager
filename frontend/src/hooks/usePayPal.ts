import { useState, useCallback } from 'react';
import type { Address } from 'viem';
import { BACKEND_API_URL } from '../lib/constants';
import type { PayPalAccount } from '../lib/types';
import { isValidEmail } from '../lib/utils';

/**
 * Hook for PayPal account integration
 */
export const usePayPal = (userAddress: Address | undefined) => {
  const [account, setAccount] = useState<PayPalAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Link PayPal account
   */
  const linkAccount = useCallback(async (paypalEmail: string): Promise<boolean> => {
    if (!userAddress) {
      setError('Wallet not connected');
      return false;
    }

    if (!isValidEmail(paypalEmail)) {
      setError('Invalid email address');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/paypal/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: userAddress,
          paypalEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to link PayPal account');
      }

      const data = await response.json();
      
      setAccount({
        email: paypalEmail,
        verified: data.verified || false,
        linkedAt: Date.now(),
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to link PayPal account';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  /**
   * Unlink PayPal account
   */
  const unlinkAccount = useCallback(async (): Promise<boolean> => {
    if (!userAddress) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/paypal/unlink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: userAddress,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unlink PayPal account');
      }

      setAccount(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unlink PayPal account';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  /**
   * Fetch linked PayPal account
   */
  const fetchAccount = useCallback(async (): Promise<void> => {
    if (!userAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/paypal/account?walletAddress=${userAddress}`);

      if (response.status === 404) {
        setAccount(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch PayPal account');
      }

      const data = await response.json();
      
      if (data.paypalEmail) {
        setAccount({
          email: data.paypalEmail,
          verified: data.verified || false,
          linkedAt: data.linkedAt,
        });
      } else {
        setAccount(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch PayPal account';
      setError(message);
      setAccount(null);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  /**
   * Check if PayPal is linked
   */
  const isLinked = account !== null;

  return {
    account,
    isLinked,
    isLoading,
    error,
    linkAccount,
    unlinkAccount,
    fetchAccount,
  };
};

/**
 * Hook for triggering PayPal payouts (for testing/manual triggers)
 */
export const usePayPalPayout = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerPayout = useCallback(async (
    subscriptionId: string,
    amount: string,
    recipientEmail: string
  ): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/paypal/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          amount,
          recipientEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process payout');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process payout';
      setError(message);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    triggerPayout,
    isProcessing,
    error,
  };
};

