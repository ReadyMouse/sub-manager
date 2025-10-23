import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { useStableRentContract, usePYUSD, usePYUSDAllowance, usePYUSDBalance } from '../hooks/useContract';
import { CONTRACTS, PAYMENT_INTERVALS } from '../lib/constants';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { apiClient, subscriptionApi } from '../lib/api';
import { parsePYUSD } from '../lib/utils';
import type { Address } from 'viem';

export const CreateSubscription: React.FC = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { createSubscription, isPending: isCreating, isSuccess: isCreateSuccess } = useStableRentContract();
  const { approve, isPending: isApproving, isSuccess: isApproveSuccess, error: approveError, hash: approveHash } = usePYUSD();
  const { allowance } = usePYUSDAllowance(
    address,
    CONTRACTS.StableRentSubscription as Address
  );
  const { balance: pyusdBalance } = usePYUSDBalance(address);
  const toast = useToast();

  const [isApproved, setIsApproved] = useState(false);
  const [allowanceType, setAllowanceType] = useState<'calculated' | 'custom'>('calculated');
  const [customAllowance, setCustomAllowance] = useState('');
  const [recipientInputType, setRecipientInputType] = useState<'lookup' | 'wallet'>('lookup');
  const [hasShownApproveError, setHasShownApproveError] = useState(false);
  const [hasShownApproveSuccess, setHasShownApproveSuccess] = useState(false);
  
  // Debug approval state
  useEffect(() => {
    console.log('Approval state debug:', {
      isApproving,
      isApproveSuccess,
      approveError,
      approveHash,
      isApproved
    });
  }, [isApproving, isApproveSuccess, approveError, approveHash, isApproved]);
  const [hasShownCreateSuccess, setHasShownCreateSuccess] = useState(false);
  const [formData, setFormData] = useState({
    serviceName: '',
    serviceDescription: '', // Off-chain: longer description
    senderCurrency: 'PYUSD',
    amount: '',
    interval: PAYMENT_INTERVALS.MONTHLY as number,
    startDate: '', // When the first payment should be due
    endDate: '',
    maxPayments: '',
    recipientIdentifier: '', // Email or username to look up recipient
    recipientWalletAddress: '', // Direct wallet address input
    recipientWalletCurrency: 'PYUSD', // Currency for direct wallet input
    notes: '', // Off-chain: personal notes
    tags: '', // Off-chain: comma-separated tags
  });

  // Connected wallets for sender
  const [connectedWallets, setConnectedWallets] = useState<Array<{
    id: string;
    walletAddress: string;
    label: string | null;
    currency: string; // Will be from wallet token balances in future
    isPrimary: boolean;
  }>>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  
  // Recipient details fetched from backend
  const [recipientDetails, setRecipientDetails] = useState<{
    recipientId: string;
    recipientAddress: string;
    recipientCurrency: string;
    displayName?: string;
  } | null>(null);
  const [isLookingUpRecipient, setIsLookingUpRecipient] = useState(false);
  const [recipientLookupError, setRecipientLookupError] = useState<string | null>(null);

  // Load user's connected wallets on mount
  useEffect(() => {
    const loadConnectedWallets = async () => {
      if (!address) return;

      try {
        // TODO: Replace with actual backend API call
        // const response = await fetch('/api/wallets/connected');
        // const data = await response.json();
        
        // Mock data for now - in production, fetch from backend
        const mockWallets = [
          {
            id: '1',
            walletAddress: address.toLowerCase(),
            label: 'MetaMask',
            currency: 'PYUSD',
            isPrimary: true,
          },
          // Add more mock wallets if needed for testing
        ];
        
        setConnectedWallets(mockWallets);
        
        // Auto-select primary wallet
        const primaryWallet = mockWallets.find(w => w.isPrimary);
        if (primaryWallet) {
          setSelectedWalletId(primaryWallet.id);
          setFormData(prev => ({ ...prev, senderCurrency: primaryWallet.currency }));
        }
      } catch (error) {
        console.error('Failed to load connected wallets:', error);
      }
    };

    loadConnectedWallets();
  }, [address]);

  // Update currency when wallet selection changes
  const handleWalletChange = (walletId: string) => {
    setSelectedWalletId(walletId);
    const selectedWallet = connectedWallets.find(w => w.id === walletId);
    if (selectedWallet) {
      setFormData(prev => ({ ...prev, senderCurrency: selectedWallet.currency }));
    }
  };

  // Validate wallet address based on currency
  const validateWalletAddress = (address: string, currency: string): { isValid: boolean; error?: string } => {
    const trimmedAddress = address.trim();
    
    switch (currency) {
      case 'PYUSD':
        // PYUSD is an ERC-20 token on Ethereum, uses standard Ethereum addresses
        // Format: 0x followed by 40 hexadecimal characters
        const ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!ethereumRegex.test(trimmedAddress)) {
          return {
            isValid: false,
            error: 'Invalid Ethereum address format. Should be 0x followed by 40 hexadecimal characters.'
          };
        }
        
        // Optional: Check EIP-55 checksum if address has mixed case
        // This is a basic check - in production you might want to use a library like ethers.js
        const hasUpperCase = /[A-F]/.test(trimmedAddress.slice(2));
        const hasLowerCase = /[a-f]/.test(trimmedAddress.slice(2));
        if (hasUpperCase && hasLowerCase) {
          // Mixed case detected - should validate checksum
          // For now, we'll just warn that it should be verified
          console.warn('Mixed case address detected - checksum should be verified');
        }
        
        return { isValid: true };
      
      // Future currency validations
      // case 'USDC':
      //   // USDC on Ethereum - same as PYUSD
      //   return validateEthereumAddress(trimmedAddress);
      // case 'BTC':
      //   // Bitcoin address validation (P2PKH, P2SH, Bech32)
      //   // Different format entirely
      //   break;
      
      default:
        // Unknown currency - basic check only
        if (trimmedAddress.length < 26) {
          return {
            isValid: false,
            error: 'Wallet address appears too short.'
          };
        }
        return { isValid: true };
    }
  };

  // Look up recipient by identifier (email, username, or wallet address)
  const lookupRecipient = async (identifier: string) => {
    if (!identifier.trim()) {
      setRecipientDetails(null);
      setRecipientLookupError(null);
      return;
    }

    setIsLookingUpRecipient(true);
    setRecipientLookupError(null);

    try {
      // For now, we only support email lookup
      // Future: support username and wallet address lookup
      const email = identifier.trim();
      
      // Call the backend API to lookup recipient by email using apiClient
      const data = await apiClient.get<{
        success: boolean;
        data: {
          recipientId: string;
          recipientAddress: string;
          recipientCurrency: string;
          displayName: string;
          email: string;
        };
      }>(`/api/users/lookup?email=${encodeURIComponent(email)}&currency=PYUSD`);

      // Set recipient details from the response
      setRecipientDetails({
        recipientId: data.data.recipientId,
        recipientAddress: data.data.recipientAddress,
        recipientCurrency: data.data.recipientCurrency,
        displayName: data.data.displayName,
      });

      toast.success('Recipient Verified', `Found ${data.data.displayName || email}`);
    } catch (error) {
      console.error('Recipient lookup failed:', error);
      setRecipientLookupError(error instanceof Error ? error.message : 'Failed to lookup recipient');
      setRecipientDetails(null);
    } finally {
      setIsLookingUpRecipient(false);
    }
  };

  // Handle approve success - Simple approach
  useEffect(() => {
    console.log('Approval success check:', { 
      isApproveSuccess, 
      hasShownApproveSuccess,
      approveHash,
      isApproving 
    });
    
    // Show success message when transaction is confirmed
    if (isApproveSuccess && !hasShownApproveSuccess) {
      console.log('Approval successful! Transaction hash:', approveHash);
      toast.success('Success', 'PYUSD allowance approved! You can now set up your payment.');
      
      // Set approved state
      setIsApproved(true);
      setHasShownApproveSuccess(true);
    }
  }, [isApproveSuccess, toast, hasShownApproveSuccess]);

  // Handle approve error
  useEffect(() => {
    if (approveError && !hasShownApproveError) {
      console.error('Approve error:', approveError);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to approve PYUSD allowance. Please try again.';
      
      if (approveError.message) {
        if (approveError.message.includes('Insufficient funds')) {
          errorMessage = 'Insufficient ETH for gas fees. Please add ETH to your wallet.';
        } else if (approveError.message.includes('User rejected')) {
          errorMessage = 'Transaction was rejected. Please try again.';
        } else if (approveError.message.includes('Internal JSON-RPC error')) {
          errorMessage = 'Network error occurred. Please check your connection and try again.';
        } else {
          errorMessage = approveError.message;
        }
      }
      
      toast.error('Approval Failed', errorMessage);
      setHasShownApproveError(true);
    }
  }, [approveError, toast, hasShownApproveError]);

  // Check if allowance is already sufficient
  useEffect(() => {
    if (allowance && formData.amount) {
      const requiredAllowance = allowanceType === 'calculated' 
        ? calculateTotalAllowance().total 
        : customAllowance;
      
      if (requiredAllowance && parseFloat(requiredAllowance) > 0) {
        // Convert allowance from wei (6 decimals for PYUSD) to USD
        const allowanceInUSD = Number(allowance) / 1_000_000;
        const requiredInUSD = parseFloat(requiredAllowance);
        
        console.log('Allowance check:', {
          allowanceInUSD,
          requiredInUSD,
          isSufficient: allowanceInUSD >= requiredInUSD,
          currentIsApproved: isApproved
        });
        
        if (allowanceInUSD >= requiredInUSD) {
          if (!isApproved) {
            console.log('Setting isApproved to true based on allowance check');
            setIsApproved(true);
          }
        } else {
          if (isApproved) {
            console.log('Setting isApproved to false - insufficient allowance');
            setIsApproved(false);
          }
        }
      }
    }
  }, [allowance, formData.amount, allowanceType, customAllowance, isApproved]);

  // Handle create success
  useEffect(() => {
    if (isCreateSuccess && !hasShownCreateSuccess) {
      setHasShownCreateSuccess(true);
      
      // Save subscription metadata to database
      const saveSubscriptionMetadata = async () => {
        try {
          // For now, we'll use a placeholder subscription ID
          // In a real implementation, you'd get this from the transaction receipt
          const subscriptionId = Date.now().toString(); // Temporary placeholder
          
          await subscriptionApi.create({
            chainId: 11155111, // Sepolia
            onChainId: subscriptionId,
            recipientId: recipientInputType === 'lookup' 
              ? recipientDetails!.recipientId 
              : '0',
            serviceName: formData.serviceName,
            amount: formData.amount,
            interval: formData.interval,
            nextPaymentDue: new Date(formData.startDate).toISOString(),
            endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
            maxPayments: formData.maxPayments ? parseInt(formData.maxPayments) : undefined,
            senderWalletAddress: address,
            recipientWalletAddress: recipientInputType === 'lookup'
              ? recipientDetails!.recipientAddress
              : formData.recipientWalletAddress,
            senderCurrency: formData.senderCurrency,
            recipientCurrency: recipientInputType === 'lookup'
              ? recipientDetails!.recipientCurrency
              : formData.recipientWalletCurrency,
            metadata: {
              notes: formData.notes,
              tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : undefined,
              serviceDescription: formData.serviceDescription,
            },
          });
          
          toast.success('Success', 'Subscription created successfully!');
          setTimeout(() => {
            navigate('/subscriptions');
          }, 2000);
        } catch (error) {
          console.error('Failed to save subscription metadata:', error);
          toast.error('Warning', 'Subscription created on blockchain but metadata could not be saved to database');
          setTimeout(() => {
            navigate('/subscriptions');
          }, 2000);
        }
      };
      
      saveSubscriptionMetadata();
    }
  }, [isCreateSuccess, navigate, toast, hasShownCreateSuccess, formData, recipientInputType, recipientDetails, address]);

  // Calculate total allowance needed for bulk approval
  const calculateTotalAllowance = (): { total: string; paymentCount: number } => {
    if (!formData.amount || !formData.interval) {
      return { total: '0', paymentCount: 0 };
    }

    const amountPerPayment = parseFloat(formData.amount) * 1.05; // Include 5% fee
    let paymentCount = 0;

    // Priority 1: If maxPayments is set, use that
    if (formData.maxPayments && parseInt(formData.maxPayments) > 0) {
      paymentCount = parseInt(formData.maxPayments);
    }
    // Priority 2: If endDate is set, calculate number of payments
    else if (formData.endDate) {
      const now = new Date();
      const end = new Date(formData.endDate);
      const diffInMs = end.getTime() - now.getTime();
      const intervalInMs = formData.interval * 1000;
      paymentCount = Math.ceil(diffInMs / intervalInMs);
      // Ensure at least 1 payment
      paymentCount = Math.max(1, paymentCount);
    }
    // Priority 3: Default to 12 payments (1 year for monthly, etc.)
    else {
      paymentCount = 12;
    }

    const totalAllowance = (amountPerPayment * paymentCount).toFixed(2);
    return { total: totalAllowance, paymentCount };
  };

  const handleApprove = async () => {
    if (!formData.amount) {
      toast.error('Error', 'Please enter an amount');
      return;
    }

    // Prevent multiple simultaneous approval calls
    if (isApproving) {
      console.log('Approval already in progress, skipping...');
      return;
    }

    try {
      // Reset flags when starting new approval attempt
      setHasShownApproveError(false);
      setHasShownApproveSuccess(false);
      setIsApproved(false); // Reset approval state when starting new approval
      
      const approvalAmount = allowanceType === 'calculated' 
        ? calculateTotalAllowance().total 
        : customAllowance;
      
      if (!approvalAmount || parseFloat(approvalAmount) <= 0) {
        toast.error('Error', 'Please enter a valid allowance amount');
        return;
      }

      // Check that custom allowance is at least one payment amount (with fee)
      const minAllowance = parseFloat(formData.amount) * 1.05;
      if (allowanceType === 'custom' && parseFloat(customAllowance) < minAllowance) {
        toast.error(
          'Allowance Too Low', 
          `Custom allowance must be at least $${minAllowance.toFixed(2)} (one payment with fee)`
        );
        return;
      }

      // Note: No PYUSD balance check needed for approval - this only sets allowance permission
      // User only needs ETH for gas, not PYUSD tokens

      // Debug logging
      console.log('Approval details:', {
        spender: CONTRACTS.StableRentSubscription,
        amount: approvalAmount,
        amountWei: parsePYUSD(approvalAmount).toString(),
        pyusdAddress: CONTRACTS.PYUSD,
        userAddress: address,
      });
      
      console.log('Contract addresses:', {
        StableRentSubscription: CONTRACTS.StableRentSubscription,
        PYUSD: CONTRACTS.PYUSD
      });

      toast.info('Wallet Action Required', 'Please sign the transaction in your wallet to approve PYUSD spending.');
      const result = await approve(CONTRACTS.StableRentSubscription as Address, approvalAmount);
      console.log('Approval result:', result);
      
    } catch (error) {
      console.error('Approve failed:', error);
      // Error is already handled by useEffect hook
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset success flag when starting new subscription creation
    setHasShownCreateSuccess(false);

    // Check if wallet is connected
    if (!isConnected || !address) {
      toast.error('Wallet Required', 'Please connect your wallet to create a subscription');
      return;
    }

    // Validate required fields
    if (!formData.serviceName || !formData.amount || !formData.interval || !formData.startDate) {
      toast.error('Error', 'Please fill in all required fields');
      return;
    }

    // Check if a wallet is selected
    if (!selectedWalletId) {
      toast.error('Error', 'Please select a payment wallet');
      return;
    }

    // Check if recipient details are available
    if (recipientInputType === 'lookup' && !recipientDetails) {
      toast.error('Error', 'Please verify the recipient');
      return;
    }

    // Check if wallet address is provided for direct wallet input
    if (recipientInputType === 'wallet' && !formData.recipientWalletAddress.trim()) {
      toast.error('Error', 'Please enter a wallet address');
      return;
    }

    // Validate wallet address format if using direct wallet input
    if (recipientInputType === 'wallet') {
      const validation = validateWalletAddress(formData.recipientWalletAddress, formData.recipientWalletCurrency);
      if (!validation.isValid) {
        toast.error('Invalid Address', validation.error || 'Please enter a valid wallet address');
        return;
      }
    }

    // Check if PYUSD is approved
    if (!isApproved) {
      toast.error('Error', 'Please approve PYUSD allowance first');
      return;
    }

    try {
      const startDate = Math.floor(new Date(formData.startDate).getTime() / 1000);
      const endDate = formData.endDate ? Math.floor(new Date(formData.endDate).getTime() / 1000) : 0;
      const maxPayments = formData.maxPayments ? parseInt(formData.maxPayments) : 0;

      // Determine recipient details based on input type
      const finalRecipientId = recipientInputType === 'lookup' 
        ? recipientDetails!.recipientId 
        : '0'; // No user ID for direct wallet
      const finalRecipientAddress = recipientInputType === 'lookup'
        ? recipientDetails!.recipientAddress
        : formData.recipientWalletAddress;
      const finalRecipientCurrency = recipientInputType === 'lookup'
        ? recipientDetails!.recipientCurrency
        : formData.recipientWalletCurrency;

      // Create subscription on-chain
      const result = await createSubscription(
        '0', // senderId - TODO: get from backend/user profile
        finalRecipientId,
        formData.amount,
        formData.interval,
        formData.serviceName,
        startDate,
        endDate,
        maxPayments,
        finalRecipientAddress as Address,
        formData.senderCurrency,
        finalRecipientCurrency
      );
      
      console.log('Subscription creation result:', result);
      
      // The transaction hash will be available in the hook's hash state
      // You can check it after the transaction is confirmed

      // TODO: After successful on-chain transaction, save off-chain metadata to backend:
      // - senderConnectedWalletId: selectedWalletId
      // - serviceDescription: formData.serviceDescription
      // - notes: formData.notes
      // - tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      // Backend endpoint: POST /api/subscriptions/{subscriptionId}/metadata
    } catch (error) {
      console.error('Create subscription failed:', error);
      toast.error('Error', 'Failed to create subscription');
    }
  };


  return (
    <div className="max-w-4xl mx-auto">
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-brand-navy mb-3">Set Up Payment</h1>
        <p className="text-gray-600 text-lg">
          Configure automated recurring payments using PYUSD stablecoin
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Subscription Details Section */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-brand-navy mb-6">Payment Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.serviceName}
                onChange={e => setFormData({ ...formData, serviceName: e.target.value })}
                className="input"
                placeholder="e.g., Netflix Subscription, Monthly Rent, Hosting Service"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Short name for this subscription (saved on-chain)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.serviceDescription}
                onChange={e => setFormData({ ...formData, serviceDescription: e.target.value })}
                className="input min-h-[80px] resize-y"
                placeholder="e.g., Monthly subscription for premium Netflix plan (4K streaming, 4 screens)"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Longer description for your records (saved off-chain)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Wallet <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedWalletId}
                  onChange={e => handleWalletChange(e.target.value)}
                  className="input"
                  required
                >
                  {connectedWallets.length === 0 ? (
                    <option value="">No wallets connected</option>
                  ) : (
                    connectedWallets.map(wallet => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.label || 'Wallet'} ({wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select which wallet to pay from
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Currency
                </label>
                <input
                  type="text"
                  value={formData.senderCurrency}
                  className="input bg-gray-50"
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-filled from selected wallet
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="input"
                  placeholder="15.49"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Payment amount in USD
                </p>
              </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Interval <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.interval}
                  onChange={e => setFormData({ ...formData, interval: parseInt(e.target.value) })}
                  className="input"
                  required
                >
                  <option value={PAYMENT_INTERVALS.DAILY}>Daily</option>
                  <option value={PAYMENT_INTERVALS.WEEKLY}>Weekly</option>
                  <option value={PAYMENT_INTERVALS.MONTHLY}>Monthly</option>
                  <option value={PAYMENT_INTERVALS.YEARLY}>Yearly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="input"
                  required
                  min={new Date().toISOString().split('T')[0]} // Can't be in the past
                />
                <p className="text-xs text-gray-500 mt-1">
                  When the first payment should be due
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for indefinite subscription
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Payments (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxPayments}
                  onChange={e => setFormData({ ...formData, maxPayments: e.target.value })}
                  className="input"
                  placeholder="e.g., 12"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of payments before auto-cancel
                </p>
              </div>
            </div>

            {/* Optional Metadata Section */}
            <div className="pt-6 border-t border-gray-200 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Optional Information (Off-Chain Only)</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="input min-h-[60px] resize-y"
                  placeholder="e.g., Shared with roommate, auto-renews annually"
                  rows={2}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Private notes for your reference only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  className="input"
                  placeholder="e.g., entertainment, streaming, monthly"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated tags to organize your subscriptions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recipient Information Section */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-brand-navy mb-6">Recipient Information</h2>
          <div className="space-y-4">
            <p className="text-gray-600 text-sm mb-4">
              Choose how to specify the payment recipient
            </p>

            {/* Radio Button Options */}
            <div className="space-y-3">
              {/* Option 1: Lookup by Email/Username */}
              <div className="border-2 rounded-lg p-4" style={{ borderColor: recipientInputType === 'lookup' ? '#0891b2' : '#e5e7eb' }}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientInputType"
                    value="lookup"
                    checked={recipientInputType === 'lookup'}
                    onChange={() => {
                      setRecipientInputType('lookup');
                      setRecipientDetails(null);
                      setRecipientLookupError(null);
                    }}
                    className="mt-1 w-4 h-4 text-brand-teal focus:ring-brand-teal"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-2">Look Up Registered User</div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Email or Username
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.recipientIdentifier}
                            onChange={e => setFormData({ ...formData, recipientIdentifier: e.target.value })}
                            onClick={() => setRecipientInputType('lookup')}
                            className="input flex-1"
                            placeholder="landlord@example.com or @username"
                            disabled={recipientInputType !== 'lookup'}
                          />
                          <button
                            type="button"
                            onClick={() => lookupRecipient(formData.recipientIdentifier)}
                            disabled={recipientInputType !== 'lookup' || isLookingUpRecipient || !formData.recipientIdentifier.trim()}
                            className="btn-secondary px-6 whitespace-nowrap"
                          >
                            {isLookingUpRecipient ? 'Looking up...' : 'Verify'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          We'll look up their payment address in our system
                        </p>
                      </div>

                      {/* Recipient lookup status */}
                      {recipientInputType === 'lookup' && recipientLookupError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">Recipient Not Found</p>
                            <p className="text-xs text-red-700 mt-1">{recipientLookupError}</p>
                          </div>
                        </div>
                      )}
                      
                      {recipientInputType === 'lookup' && recipientDetails && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">
                              Recipient Verified{recipientDetails.displayName ? `: ${recipientDetails.displayName}` : ''}
                            </p>
                            <p className="text-xs text-green-700 mt-1 font-mono">
                              {recipientDetails.recipientAddress.slice(0, 10)}...{recipientDetails.recipientAddress.slice(-8)}
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              Currency: {recipientDetails.recipientCurrency}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              </div>

              {/* Option 2: Direct Wallet Address */}
              <div className="border-2 rounded-lg p-4" style={{ borderColor: recipientInputType === 'wallet' ? '#0891b2' : '#e5e7eb' }}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientInputType"
                    value="wallet"
                    checked={recipientInputType === 'wallet'}
                    onChange={() => {
                      setRecipientInputType('wallet');
                      setRecipientDetails(null);
                      setRecipientLookupError(null);
                    }}
                    className="mt-1 w-4 h-4 text-brand-teal focus:ring-brand-teal"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-2">Enter Wallet Address Directly</div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Wallet Address
                        </label>
                        <input
                          type="text"
                          value={formData.recipientWalletAddress}
                          onChange={e => setFormData({ ...formData, recipientWalletAddress: e.target.value })}
                          onClick={() => setRecipientInputType('wallet')}
                          className="input w-full"
                          placeholder="0x..."
                          disabled={recipientInputType !== 'wallet'}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.recipientWalletCurrency === 'PYUSD' 
                            ? 'Ethereum address format: 0x + 40 hex characters'
                            : 'Enter the recipient\'s crypto wallet address'
                          }
                        </p>
                        
                        {/* Real-time validation feedback */}
                        {recipientInputType === 'wallet' && formData.recipientWalletAddress && (
                          (() => {
                            const validation = validateWalletAddress(formData.recipientWalletAddress, formData.recipientWalletCurrency);
                            if (!validation.isValid) {
                              return (
                                <div className="mt-2 flex items-start gap-1 text-xs text-red-600">
                                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{validation.error}</span>
                                </div>
                              );
                            } else if (formData.recipientWalletAddress.length >= 42) {
                              return (
                                <div className="mt-2 flex items-start gap-1 text-xs text-green-600">
                                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Valid {formData.recipientWalletCurrency} address format</span>
                                </div>
                              );
                            }
                            return null;
                          })()
                        )}
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Receive Currency
                        </label>
                        <select
                          value={formData.recipientWalletCurrency}
                          onChange={e => setFormData({ ...formData, recipientWalletCurrency: e.target.value })}
                          onClick={() => setRecipientInputType('wallet')}
                          className="input w-full"
                          disabled={recipientInputType !== 'wallet'}
                        >
                          <option value="PYUSD">PYUSD</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Currency they will receive (more coming soon)
                        </p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Approval Section */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-brand-navy mb-6">Payment Approval</h2>
          <div className="space-y-4">
            {/* Balance and Allowance Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Your PYUSD Balance:</span>
                <span className="font-semibold text-gray-900">
                  {pyusdBalance !== undefined 
                    ? `$${(Number(pyusdBalance) / 1_000_000).toFixed(2)}` 
                    : 'Loading...'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Allowance:</span>
                <span className="font-semibold text-gray-900">
                  {allowance !== undefined 
                    ? `$${(Number(allowance) / 1_000_000).toFixed(2)}` 
                    : 'Loading...'}
                </span>
              </div>
            </div>

            {isApproved ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">Approved ✓</p>
                    <p className="text-sm text-green-700">
                      {allowanceType === 'calculated' 
                        ? `Allowance approved for ${calculateTotalAllowance().paymentCount} payments ($${calculateTotalAllowance().total} total)`
                        : `Custom allowance of $${customAllowance} approved`
                      }
                    </p>
                  </div>
                </div>
                {approveHash && (
                  <div className="pt-2 border-t border-green-200">
                    <a 
                      href={`https://etherscan.io/tx/${approveHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-700 hover:text-green-900 flex items-center gap-1"
                    >
                      View transaction on Etherscan
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">About Payment Approval</p>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        This is a <strong>one-time allowance ceiling approval</strong> that allows the contract to automatically process payments on your schedule. 
                        Payments will be extracted according to the schedule you set above. You can cancel the subscription at any time to stop all future payments. 
                        This avoids having to approve each individual transaction every month.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Radio Button Options */}
                  <div className="space-y-3">
                    {/* Calculated Allowance Option */}
                    <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderColor: allowanceType === 'calculated' ? '#0891b2' : '#e5e7eb' }}>
                      <input
                        type="radio"
                        name="allowanceType"
                        value="calculated"
                        checked={allowanceType === 'calculated'}
                        onChange={() => setAllowanceType('calculated')}
                        className="mt-1 w-4 h-4 text-brand-teal focus:ring-brand-teal"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">Use Calculated Allowance (Recommended)</div>
                        <div className="bg-gray-50 rounded p-2 text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment (with fee):</span>
                            <span className="font-medium text-gray-900">
                              ${formData.amount ? (parseFloat(formData.amount) * 1.05).toFixed(2) : '0.00'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Number of payments:</span>
                            <span className="font-medium text-gray-900">
                              {calculateTotalAllowance().paymentCount}
                              {!formData.maxPayments && !formData.endDate && <span className="text-xs text-gray-500 ml-1">(default)</span>}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-gray-200">
                            <span className="font-semibold text-gray-900">Total allowance:</span>
                            <span className="font-bold text-brand-teal">
                              ${calculateTotalAllowance().total}
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>

                    {/* Custom Allowance Option */}
                    <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderColor: allowanceType === 'custom' ? '#0891b2' : '#e5e7eb' }}>
                      <input
                        type="radio"
                        name="allowanceType"
                        value="custom"
                        checked={allowanceType === 'custom'}
                        onChange={() => setAllowanceType('custom')}
                        className="mt-1 w-4 h-4 text-brand-teal focus:ring-brand-teal"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-2">Custom Allowance Amount</div>
                        <input
                          type="number"
                          step="0.01"
                          min={(parseFloat(formData.amount || '0') * 1.05).toFixed(2)}
                          value={customAllowance}
                          onChange={e => setCustomAllowance(e.target.value)}
                          onClick={() => setAllowanceType('custom')}
                          className="input w-full"
                          placeholder="Enter custom amount (USD)"
                          disabled={allowanceType !== 'custom'}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum: ${formData.amount ? (parseFloat(formData.amount) * 1.05).toFixed(2) : '0.00'} (one payment with fee)
                        </p>
                        {allowanceType === 'custom' && customAllowance && parseFloat(customAllowance) < (parseFloat(formData.amount || '0') * 1.05) && (
                          <div className="mt-2 flex items-start gap-1 text-xs text-red-600">
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>
                              Warning: This amount is too low. The transaction will fail. Minimum is ${(parseFloat(formData.amount || '0') * 1.05).toFixed(2)}.
                    </span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving || !formData.amount || (allowanceType === 'custom' && !customAllowance)}
                  className="btn-primary w-full relative"
                >
                  {isApproving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Waiting for signature...</span>
                    </span>
                  ) : (
                    `Approve ${allowanceType === 'calculated' ? '$' + calculateTotalAllowance().total : customAllowance ? '$' + customAllowance : 'Allowance'}`
                  )}
                </button>

                {/* Wallet instruction during approval */}
                {isApproving && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 animate-pulse">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Check Your Wallet</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Please confirm the transaction in your wallet to approve the PYUSD spending allowance.
                      </p>
                    </div>
                  </div>
                )}

              </>
            )}
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-teal rounded-xl p-6 text-white shadow-strong">
          <h2 className="text-xl font-bold mb-4">Payment Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="opacity-90">Service:</span>
              <span className="font-semibold">{formData.serviceName || '—'}</span>
            </div>
            {formData.serviceDescription && (
            <div className="flex justify-between">
              <span className="opacity-90">Description:</span>
                <span className="font-semibold text-xs text-right max-w-[60%]">
                  {formData.serviceDescription.length > 50 
                    ? formData.serviceDescription.substring(0, 50) + '...' 
                    : formData.serviceDescription}
                </span>
              </div>
            )}
            {formData.tags && (
              <div className="flex justify-between">
                <span className="opacity-90">Tags:</span>
                <span className="font-semibold text-xs">{formData.tags}</span>
              </div>
            )}
            {selectedWalletId && (
              <div className="flex justify-between">
                <span className="opacity-90">Payment Wallet:</span>
                <span className="font-semibold text-xs">
                  {connectedWallets.find(w => w.id === selectedWalletId)?.label || 'Wallet'} (
                  {connectedWallets.find(w => w.id === selectedWalletId)?.walletAddress.slice(0, 6)}...
                  {connectedWallets.find(w => w.id === selectedWalletId)?.walletAddress.slice(-4)})
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="opacity-90">Payment Currency:</span>
              <span className="font-semibold">{formData.senderCurrency}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-90">Amount:</span>
              <span className="font-semibold">${formData.amount || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-90">Processing Fee (5%):</span>
              <span className="font-semibold">
                ${formData.amount ? (parseFloat(formData.amount) * 0.05).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white border-opacity-30 text-lg">
              <span className="font-bold">Total per Payment:</span>
              <span className="font-bold">
                ${formData.amount ? (parseFloat(formData.amount) * 1.05).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-90">Frequency:</span>
              <span className="font-semibold">
                {formData.interval === PAYMENT_INTERVALS.DAILY && 'Daily'}
                {formData.interval === PAYMENT_INTERVALS.WEEKLY && 'Weekly'}
                {formData.interval === PAYMENT_INTERVALS.MONTHLY && 'Monthly'}
                {formData.interval === PAYMENT_INTERVALS.YEARLY && 'Yearly'}
              </span>
            </div>
            {formData.endDate && (
              <div className="flex justify-between">
                <span className="opacity-90">End Date:</span>
                <span className="font-semibold">{formData.endDate}</span>
              </div>
            )}
            {formData.maxPayments && (
              <div className="flex justify-between">
                <span className="opacity-90">Max Payments:</span>
                <span className="font-semibold">{formData.maxPayments}</span>
              </div>
            )}
            {(recipientInputType === 'lookup' && recipientDetails) || (recipientInputType === 'wallet' && formData.recipientWalletAddress) ? (
              <>
              <div className="flex justify-between pt-2 mt-2 border-t border-white border-opacity-30">
                <span className="opacity-90">Recipient:</span>
                  <span className="font-semibold">
                    {recipientInputType === 'lookup' 
                      ? (recipientDetails?.displayName || formData.recipientIdentifier)
                      : 'Direct Wallet'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-90">Recipient Address:</span>
                <span className="font-semibold text-xs break-all">
                    {recipientInputType === 'lookup'
                      ? `${recipientDetails!.recipientAddress.slice(0, 6)}...${recipientDetails!.recipientAddress.slice(-4)}`
                      : `${formData.recipientWalletAddress.slice(0, 6)}...${formData.recipientWalletAddress.slice(-4)}`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-90">Receive Currency:</span>
                  <span className="font-semibold">
                    {recipientInputType === 'lookup' 
                      ? recipientDetails!.recipientCurrency
                      : formData.recipientWalletCurrency
                    }
                </span>
              </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Wallet Connection Notice */}
        {!isConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">Wallet Connection Required</h3>
                <p className="text-sm text-blue-700">
                  You can fill out the form now, but you'll need to connect your wallet to submit and create the subscription.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              isCreating || 
              !isApproved || 
              (recipientInputType === 'lookup' && !recipientDetails) ||
              (recipientInputType === 'wallet' && !formData.recipientWalletAddress) ||
              !selectedWalletId
            }
            className={`flex-1 ${
              isCreating || !isApproved || 
              (recipientInputType === 'lookup' && !recipientDetails) ||
              (recipientInputType === 'wallet' && !formData.recipientWalletAddress) ||
              !selectedWalletId
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } px-6 py-3 rounded-lg font-medium transition-colors duration-200`}
          >
            {isCreating ? 'Setting Up Payment...' : 'Set Up Payment'}
          </button>
        </div>

        {/* Validation Messages */}
        {!isApproved && (
          <p className="text-sm text-gray-500 text-center">
            Please approve the payment before setting up the subscription
          </p>
        )}
        {isApproved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-green-900">
              Payment approved! You can now set up your subscription.
            </p>
          </div>
        )}
        {((recipientInputType === 'lookup' && !recipientDetails) || (recipientInputType === 'wallet' && !formData.recipientWalletAddress)) && isApproved && (
          <p className="text-sm text-gray-500 text-center">
            {recipientInputType === 'lookup' 
              ? 'Please verify the recipient before setting up the payment'
              : 'Please enter a wallet address before setting up the payment'
            }
          </p>
        )}
      </form>
    </div>
  );
};

