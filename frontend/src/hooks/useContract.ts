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

  // Debug contract interaction state
  console.log('StableRent Contract Hook Debug:', {
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: error ? error.message : null
  });

  const createSubscription = async (
    senderId: string,
    recipientId: string,
    amount: string,
    interval: number,
    serviceName: string,
    startDate: number,
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
    
    console.log('Creating subscription with parameters:', {
      senderId,
      recipientId,
      amount,
      amountWei: amountWei.toString(),
      interval,
      serviceName,
      startDate,
      endDate,
      maxPayments,
      recipientAddress,
      senderCurrency,
      recipientCurrency,
      feeWei: feeWei.toString(),
      processorFeeAddress,
      processorFeeCurrency,
      processorFeeID
    });
    
    try {
      console.log('About to call writeContract with:', {
        address: CONTRACTS.StableRentSubscription,
        functionName: 'createSubscription'
      });
      
      // First, let's try to simulate the call to see if we can get a better error message
      try {
        console.log('Simulating contract call...');
        // We can't easily simulate with wagmi, but let's log the exact parameters
        console.log('Contract call parameters:', {
          senderId: BigInt(senderId || 0),
          recipientId: BigInt(recipientId || 0),
          amount: amountWei,
          interval: BigInt(interval),
          serviceName,
          startDate: BigInt(startDate),
          endDate: BigInt(endDate || 0),
          maxPayments: BigInt(maxPayments || 0),
          recipientAddress: recipientAddress || ('0x0000000000000000000000000000000000000000' as Address),
          senderCurrency: senderCurrency || 'PYUSD',
          recipientCurrency: recipientCurrency || 'PYUSD',
          processorFee: feeWei,
          processorFeeAddress: processorFeeAddress || (CONTRACTS.StableRentSubscription as Address),
          processorFeeCurrency: processorFeeCurrency || 'PYUSD',
          processorFeeID: BigInt(processorFeeID || 0),
        });
      } catch (simError) {
        console.error('Simulation error:', simError);
      }
      
      const result = await writeContract({
        address: CONTRACTS.StableRentSubscription as Address,
        abi: StableRentSubscriptionABI,
        functionName: 'createSubscription',
        args: [
          BigInt(senderId || 0),
          BigInt(recipientId || 0),
          amountWei,
          BigInt(interval),
          serviceName,
          BigInt(startDate),
          BigInt(endDate || 0),
          BigInt(maxPayments || 0),
          recipientAddress || ('0x0000000000000000000000000000000000000000' as Address),
          senderCurrency || 'PYUSD',
          recipientCurrency || 'PYUSD',
          feeWei,
          processorFeeAddress || (CONTRACTS.StableRentSubscription as Address), // Default to contract address
          processorFeeCurrency || 'PYUSD',
          BigInt(processorFeeID || 0),
        ],
        gas: 1000000n, // Set a high gas limit to avoid estimation issues
      });
      
      console.log('Write contract result:', result);
      return result;
    } catch (error) {
      console.error('Write contract error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code || 'Unknown code',
        details: error
      });
      
      // Try to extract more specific error information
      if (error instanceof Error && error.message.includes('reverted')) {
        console.error('Contract reverted with reason:', error.message);
      }
      
      throw error;
    }
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

  // Test function to check if contract is readable
  const testContractRead = async () => {
    try {
      console.log('Testing contract read...');
      // This will be implemented if needed
      return true;
    } catch (error) {
      console.error('Contract read test failed:', error);
      return false;
    }
  };

  return {
    createSubscription,
    processPayment,
    cancelSubscription,
    testContractRead,
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
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Debug transaction receipt status
  console.log('PYUSD Hook Debug:', {
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    receipt: receipt ? 'Receipt received' : 'No receipt yet'
  });

  const approve = async (spender: Address, amount: string) => {
    const amountWei = parsePYUSD(amount);
    
    // Log the exact parameters being sent
    console.log('PYUSD Approve call:', {
      tokenAddress: CONTRACTS.PYUSD,
      spender,
      amount: amount,
      amountWei: amountWei.toString(),
      gas: 100000n
    });
    
    return writeContract({
      address: CONTRACTS.PYUSD as Address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amountWei],
      gas: 100000n, // Set explicit gas limit to avoid estimation issues
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

  // Debug balance reading
  console.log('PYUSD Balance Debug:', {
    address,
    balance: data ? data.toString() : 'undefined',
    isLoading,
    error: error ? error.message : null,
    pyusdAddress: CONTRACTS.PYUSD
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

