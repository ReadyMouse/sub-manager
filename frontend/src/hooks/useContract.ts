import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import type { Address } from 'viem';
import { CONTRACTS } from '../lib/constants';
import { StableRentSubscriptionABI, ERC20_ABI } from '../lib/abi';
import { parsePYUSD } from '../lib/utils';

/**
 * Hook for interacting with StableRentSubscription contract
 */
export const useStableRentContract = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createSubscription = async (
    senderId: string,
    recipientId: string,
    amount: string,
    interval: number,
    serviceName: string,
    endDate?: number,
    maxPayments?: number,
    recipientAddress?: Address,
    senderCurrency?: string,
    recipientCurrency?: string,
    processorFee?: string,
    processorFeeAddress?: Address,
    processorFeeCurrency?: string,
    processorFeeID?: string
  ) => {
    const amountWei = parsePYUSD(amount);
    // Calculate processor fee (5% of amount) if not provided
    const feeWei = processorFee 
      ? parsePYUSD(processorFee)
      : (amountWei * BigInt(5)) / BigInt(100);
    
    return writeContract({
      address: CONTRACTS.StableRentSubscription as Address,
      abi: StableRentSubscriptionABI,
      functionName: 'createSubscription',
      args: [
        BigInt(senderId || 0),
        BigInt(recipientId || 0),
        amountWei,
        BigInt(interval),
        serviceName,
        BigInt(endDate || 0),
        BigInt(maxPayments || 0),
        recipientAddress || ('' as Address),
        senderCurrency || 'PYUSD',
        recipientCurrency || 'PYUSD',
        feeWei,
        processorFeeAddress || CONTRACTS.StableRentSubscription as Address, // Default to contract address
        processorFeeCurrency || 'PYUSD',
        BigInt(processorFeeID || 0),
      ],
    });
  };

  const processPayment = async (subscriptionId: bigint) => {
    return writeContract({
      address: CONTRACTS.StableRentSubscription as Address,
      abi: StableRentSubscriptionABI,
      functionName: 'processPayment',
      args: [subscriptionId],
    });
  };

  const cancelSubscription = async (subscriptionId: bigint) => {
    return writeContract({
      address: CONTRACTS.StableRentSubscription as Address,
      abi: StableRentSubscriptionABI,
      functionName: 'cancelSubscription',
      args: [subscriptionId],
    });
  };

  return {
    createSubscription,
    processPayment,
    cancelSubscription,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
};

/**
 * Hook for reading subscription data
 */
export const useSubscription = (subscriptionId: bigint | undefined) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.StableRentSubscription as Address,
    abi: StableRentSubscriptionABI,
    functionName: 'getSubscription',
    args: subscriptionId !== undefined ? [subscriptionId] : undefined,
    query: {
      enabled: subscriptionId !== undefined,
    },
  });

  return {
    subscription: data,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook for reading user's subscriptions
 */
export const useUserSubscriptions = (userAddress: Address | undefined) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.StableRentSubscription as Address,
    abi: StableRentSubscriptionABI,
    functionName: 'getUserSubscriptions',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    subscriptionIds: data as bigint[] | undefined,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook for PYUSD token interactions
 */
export const usePYUSD = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (spender: Address, amount: string) => {
    const amountWei = parsePYUSD(amount);
    return writeContract({
      address: CONTRACTS.PYUSD as Address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amountWei],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
};

/**
 * Hook for reading PYUSD balance
 */
export const usePYUSDBalance = (address: Address | undefined) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.PYUSD as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  return {
    balance: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook for reading PYUSD allowance
 */
export const usePYUSDAllowance = (
  owner: Address | undefined,
  spender: Address | undefined
) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.PYUSD as Address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!(owner && spender),
    },
  });

  return {
    allowance: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
};
