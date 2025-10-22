import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useReadContract, useDisconnect } from 'wagmi';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { usePayments } from '../hooks/usePayments';
import { formatPYUSD, shortenAddress, formatDateTime, getEtherscanLink } from '../lib/utils';
import { PYUSD_SYMBOL, CONTRACTS } from '../lib/constants';
import { SkeletonList } from '../components/Skeleton';
import { erc20Abi } from 'viem';
import type { EnvioSubscription } from '../lib/types';

interface ConnectedWallet {
  id: string;
  walletAddress: string;
  label: string;
  isPrimary: boolean;
  isVerified: boolean;
  connectedAt: string;
  lastUsedAt: string | null;
  balance?: bigint;
}

interface ReceiveOnlyWallet {
  id: string;
  address: string;
  currency: string;
  label: string | null;
  addressType: 'WALLET' | 'CUSTODIAL' | 'EXCHANGE';
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

// Subscription Card Component
const SubscriptionCard: React.FC<{ subscription: EnvioSubscription; isActive: boolean }> = ({ subscription, isActive }) => {
  const formatInterval = (intervalSeconds: string) => {
    const seconds = parseInt(intervalSeconds);
    const days = Math.floor(seconds / 86400);
    if (days === 30 || days === 31) return 'Monthly';
    if (days === 7) return 'Weekly';
    if (days === 365) return 'Yearly';
    return `Every ${days} days`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const nextPaymentDate = parseInt(subscription.nextPaymentDue) * 1000;
  const isOverdue = isActive && nextPaymentDate < Date.now();
  const daysUntilPayment = Math.ceil((nextPaymentDate - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className={`card ${isActive ? 'hover:shadow-medium' : ''} transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-brand-navy">{subscription.serviceProviderId}</h3>
            {isActive ? (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                Active
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                Ended
              </span>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="ml-2 font-semibold text-brand-navy">
                  {formatPYUSD(BigInt(subscription.amount))} {PYUSD_SYMBOL}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Frequency:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {formatInterval(subscription.interval)}
                </span>
              </div>
            </div>

            {isActive && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Next Payment:</span>
                {isOverdue ? (
                  <span className="text-sm font-medium text-red-600">
                    Overdue (was due {formatDate(subscription.nextPaymentDue)})
                  </span>
                ) : (
                  <span className="text-sm text-gray-900">
                    {formatDate(subscription.nextPaymentDue)} 
                    <span className="text-gray-500 ml-1">({daysUntilPayment} days)</span>
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div>
                Payments made: {subscription.paymentCount}
              </div>
              <div>
                Started: {formatDate(subscription.createdAt)}
              </div>
              {subscription.endDate && (
                <div>
                  Ended: {formatDate(subscription.endDate)}
                </div>
              )}
            </div>
          </div>
        </div>

        {isActive && (
          <div className="flex flex-col gap-2">
            <button
              className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
              onClick={() => {
                if (confirm('Are you sure you want to cancel this subscription?')) {
                  console.log('Cancel subscription:', subscription.id);
                  // TODO: Implement cancel subscription
                }
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Additional Info Bar */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          <span className="font-medium">Subscription ID:</span> #{subscription.id}
        </div>
        <a
          href={`/subscriptions?id=${subscription.id}`}
          className="text-xs text-brand-teal hover:text-brand-teal-dark font-medium"
        >
          View Details →
        </a>
      </div>
    </div>
  );
};

// Wallet Card Component
const WalletCard: React.FC<{ wallet: ConnectedWallet }> = ({ wallet }) => {
  const { data: balanceData } = useReadContract({
    address: CONTRACTS.PYUSD as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [wallet.walletAddress as `0x${string}`],
  });

  const balance = balanceData as bigint | undefined;

  return (
    <div className="card hover:shadow-medium transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-brand-navy">{wallet.label}</h3>
            {wallet.isPrimary && (
              <span className="bg-brand-teal text-white px-2 py-0.5 rounded-full text-xs font-medium">
                Primary
              </span>
            )}
            {wallet.isVerified && (
              <span className="text-green-600" title="Verified">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Address:</span>
              <span className="font-mono text-sm text-gray-900">
                {shortenAddress(wallet.walletAddress)}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(wallet.walletAddress)}
                className="text-gray-400 hover:text-brand-teal transition-colors"
                title="Copy address"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Balance:</span>
              <span className="font-semibold text-brand-navy">
                {balance ? formatPYUSD(balance) : '0.00'} {PYUSD_SYMBOL}
              </span>
            </div>

            {wallet.lastUsedAt && (
              <div className="text-xs text-gray-500">
                Last used: {new Date(wallet.lastUsedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!wallet.isPrimary && (
            <button
              className="text-sm text-brand-teal hover:text-brand-teal-dark font-medium transition-colors"
              title="Set as primary"
            >
              Set Primary
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Receive-Only Wallet Card Component
const ReceiveOnlyWalletCard: React.FC<{ 
  wallet: ReceiveOnlyWallet; 
  onEdit: (wallet: ReceiveOnlyWallet) => void;
  onDelete: (id: string) => void;
}> = ({ wallet, onEdit, onDelete }) => {
  return (
    <div className="card hover:shadow-medium transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-brand-navy">
              {wallet.label || 'Unnamed Address'}
            </h3>
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {wallet.currency}
            </span>
            {wallet.isDefault && (
              <span className="bg-brand-teal text-white px-2 py-0.5 rounded-full text-xs font-medium">
                Default
              </span>
            )}
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
              Receive Only
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Address:</span>
              <span className="font-mono text-sm text-gray-900">
                {shortenAddress(wallet.address)}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(wallet.address)}
                className="text-gray-400 hover:text-brand-teal transition-colors"
                title="Copy address"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Type:</span>
              <span className="text-sm text-gray-900 capitalize">
                {wallet.addressType.toLowerCase()}
              </span>
            </div>

            <div className="text-xs text-gray-500">
              Added: {new Date(wallet.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(wallet)}
            className="text-sm text-brand-teal hover:text-brand-teal-dark font-medium transition-colors"
            title="Edit"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this address?')) {
                onDelete(wallet.id);
              }
            }}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            title="Delete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};


// Helper function to convert backend subscription to frontend format
const convertSubscription = (sub: any): EnvioSubscription => ({
  id: sub.id,
  subscriber: sub.senderWalletAddress || '',
  serviceProviderId: sub.serviceName,
  amount: sub.amount,
  interval: sub.interval.toString(),
  nextPaymentDue: sub.nextPaymentDue,
  endDate: sub.endDate,
  maxPayments: sub.maxPayments?.toString(),
  paymentCount: sub.paymentCount.toString(),
  failedPaymentCount: sub.failedPaymentCount.toString(),
  isActive: sub.isActive,
  processorFee: sub.processorFee || '0',
  processorFeeAddress: sub.processorFeeAddress || '',
  processorFeeCurrency: sub.processorFeeCurrency || 'PYUSD',
  processorFeeID: sub.processorFeeID || '',
  createdAt: sub.createdAt,
});

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { user, logout, isAuthenticated } = useAuth();
  const { profile, preferences, updateProfile, updatePreferences } = useUserProfile();
  const { subscriptions, loading: subscriptionsLoading } = useSubscriptions();
  const { payments: allPayments, loading: allPaymentsLoading } = usePayments();
  const [activeTab, setActiveTab] = useState<'profile' | 'wallets' | 'subscriptions' | 'history'>('profile');
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
  });
  // Receive-only wallets state
  const [receiveWallets, setReceiveWallets] = useState<ReceiveOnlyWallet[]>([]);
  const [loadingReceiveWallets, setLoadingReceiveWallets] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ReceiveOnlyWallet | null>(null);
  const [addressForm, setAddressForm] = useState<{
    address: string;
    currency: string;
    label: string;
    addressType: 'WALLET' | 'CUSTODIAL' | 'EXCHANGE';
    isDefault: boolean;
  }>({
    address: '',
    currency: 'PYUSD',
    label: '',
    addressType: 'WALLET',
    isDefault: false,
  });

  // Load connected wallets
  useEffect(() => {
    const loadWallets = async () => {
      if (!isConnected) return;
      
      setLoadingWallets(true);
      try {
        // TODO: Replace with actual API call when backend is integrated
        // For now, using mock data structure
        const mockWallets: ConnectedWallet[] = [
          {
            id: '1',
            walletAddress: address || '0x0000000000000000000000000000000000000000',
            label: 'My Primary Wallet',
            isPrimary: true,
            isVerified: true,
            connectedAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
          },
        ];
        setConnectedWallets(mockWallets);
      } catch (error) {
        console.error('Failed to load connected wallets:', error);
      } finally {
        setLoadingWallets(false);
      }
    };

    loadWallets();
  }, [isConnected, address]);

  // Load receive-only payment addresses
  useEffect(() => {
    const loadPaymentAddresses = async () => {
      if (!isConnected) return;

      setLoadingReceiveWallets(true);
      try {
        // Note: For now, we're using mock data since authentication isn't fully wired up
        // When backend auth is integrated, replace with: const result = await paymentAddressApi.getAll(token);
        
        // Mock data for demonstration
        const mockAddresses: ReceiveOnlyWallet[] = [];
        setReceiveWallets(mockAddresses);
        
        // Uncomment when backend is integrated with auth:
        // const result = await paymentAddressApi.getAll();
        // setReceiveWallets(Array.isArray(result.data) ? result.data : []);
      } catch (error) {
        console.error('Failed to load payment addresses:', error);
        setReceiveWallets([]);
      } finally {
        setLoadingReceiveWallets(false);
      }
    };

    loadPaymentAddresses();
  }, [isConnected]);

  // Handlers for receive-only addresses
  const openAddAddressModal = () => {
    setEditingAddress(null);
    setAddressForm({ address: '', currency: 'PYUSD', label: '', addressType: 'WALLET', isDefault: false });
    setShowAddressModal(true);
  };

  const openEditAddressModal = (wallet: ReceiveOnlyWallet) => {
    setEditingAddress(wallet);
    setAddressForm({
      address: wallet.address,
      currency: wallet.currency,
      label: wallet.label || '',
      addressType: wallet.addressType,
      isDefault: wallet.isDefault,
    });
    setShowAddressModal(true);
  };

  const submitAddressForm = async () => {
    try {
      const payload = {
        address: addressForm.address.trim(),
        currency: addressForm.currency,
        label: addressForm.label.trim() || undefined,
        addressType: addressForm.addressType,
        isDefault: addressForm.isDefault,
      };

      if (!payload.address || !payload.currency) {
        alert('Please enter an address and select a currency');
        return;
      }

      // For now, add to local state since backend auth isn't wired up yet
      // When backend auth is integrated, replace with actual API calls
      
      if (editingAddress) {
        // Update existing address
        const updatedAddress: ReceiveOnlyWallet = {
          ...editingAddress,
          label: payload.label || null,
          isDefault: payload.isDefault,
        };
        setReceiveWallets(prev => prev.map(w => (w.id === editingAddress.id ? updatedAddress : w)));
        
        // Uncomment when backend is integrated:
        // const result = await paymentAddressApi.update(editingAddress.id, {
        //   label: payload.label,
        //   isDefault: payload.isDefault,
        //   isActive: true,
        // });
        // setReceiveWallets(prev => prev.map(w => (w.id === editingAddress.id ? result.data : w)));
      } else {
        // Create new address
        const newAddress: ReceiveOnlyWallet = {
          id: `temp-${Date.now()}`, // Temporary ID
          address: payload.address,
          currency: payload.currency,
          label: payload.label || null,
          addressType: payload.addressType,
          isDefault: payload.isDefault,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        setReceiveWallets(prev => [newAddress, ...prev]);
        
        // Uncomment when backend is integrated:
        // const result = await paymentAddressApi.create(payload);
        // if (result.data) setReceiveWallets(prev => [result.data, ...prev]);
      }
    } catch (error) {
      console.error('Failed to save payment address:', error);
      alert('Failed to save address. Please try again.');
    } finally {
      setShowAddressModal(false);
      setEditingAddress(null);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      // For now, delete from local state
      setReceiveWallets(prev => prev.filter(w => w.id !== id));
      
      // Uncomment when backend is integrated:
      // await paymentAddressApi.delete(id);
      // setReceiveWallets(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Failed to delete payment address:', error);
      alert('Failed to delete address. Please try again.');
    }
  };


  // Update editing profile when real profile loads
  useEffect(() => {
    if (profile) {
      setEditingProfile({
        displayName: profile.displayName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
      });
    }
  }, [profile]);

  const handleProfileUpdate = async () => {
    if (!profile) return;
    
    try {
      await updateProfile({
        displayName: editingProfile.displayName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: editingProfile.phoneNumber,
      });
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleVerifyPhone = async () => {
    // TODO: Implement phone verification
    console.log('Verify phone:', profile?.phoneNumber);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleDisconnectWallet = () => {
    disconnect();
  };

  const handleVerifyEmail = async () => {
    // TODO: Implement email verification
    console.log('Verify email:', profile?.email);
  };

  const handleNotificationChange = async (key: string) => {
    if (!preferences) return;
    
    try {
      const newValue = !preferences[key as keyof typeof preferences];
      await updatePreferences({
        [key]: newValue,
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-brand-navy mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600">
          Connect your wallet to access settings
        </p>
      </div>
    );
  }


  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-navy mb-6">Profile & Settings</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-brand-teal text-brand-teal'
              : 'border-transparent text-gray-600 hover:text-brand-navy hover:border-gray-300'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('wallets')}
          className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
            activeTab === 'wallets'
              ? 'border-brand-teal text-brand-teal'
              : 'border-transparent text-gray-600 hover:text-brand-navy hover:border-gray-300'
          }`}
        >
          Wallets
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
            activeTab === 'subscriptions'
              ? 'border-brand-teal text-brand-teal'
              : 'border-transparent text-gray-600 hover:text-brand-navy hover:border-gray-300'
          }`}
        >
          Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-brand-teal text-brand-teal'
              : 'border-transparent text-gray-600 hover:text-brand-navy hover:border-gray-300'
          }`}
        >
          Payment History
        </button>
      </div>

      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Information */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-brand-navy">Profile Information</h2>
              {!isEditingProfile ? (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="text-sm text-brand-teal hover:text-brand-teal-dark font-medium transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors px-3 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileUpdate}
                    className="text-sm bg-brand-teal text-white hover:bg-brand-teal-dark font-medium transition-colors px-3 py-1 rounded-lg"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={editingProfile.displayName}
                    onChange={(e) => setEditingProfile({ ...editingProfile, displayName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.displayName || 'Not provided'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center gap-2">
                  {isEditingProfile ? (
                    <input
                      type="email"
                      value={editingProfile.email}
                      onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  ) : (
                    <p className="flex-1 text-gray-900">{profile?.email || 'Not provided'}</p>
                  )}
                  {profile?.email && (
                    profile.emailVerified ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <button
                        onClick={handleVerifyEmail}
                        className="text-sm text-brand-teal hover:text-brand-teal-dark font-medium transition-colors"
                      >
                        Verify
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="flex items-center gap-2">
                  {isEditingProfile ? (
                    <input
                      type="tel"
                      value={editingProfile.phoneNumber}
                      onChange={(e) => setEditingProfile({ ...editingProfile, phoneNumber: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  ) : (
                    <p className="flex-1 text-gray-900">{profile?.phoneNumber || 'Not provided'}</p>
                  )}
                  {profile?.phoneNumber && (
                    profile.phoneVerified ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <button
                        onClick={handleVerifyPhone}
                        className="text-sm text-brand-teal hover:text-brand-teal-dark font-medium transition-colors"
                      >
                        Verify
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold text-brand-navy mb-4">Notification Settings</h2>
            <div className="space-y-4">
              {/* Communication Channels */}
              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Communication Channels</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-gray-900 font-medium">Email Notifications</span>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences?.emailNotifications || false}
                      onChange={() => handleNotificationChange('emailNotifications')}
                      className="w-5 h-5 text-brand-teal focus:ring-brand-teal rounded"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-gray-900 font-medium">SMS Notifications</span>
                      <p className="text-sm text-gray-500">Receive notifications via text message</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences?.smsNotifications || false}
                      onChange={() => handleNotificationChange('smsNotifications')}
                      className="w-5 h-5 text-brand-teal focus:ring-brand-teal rounded"
                      disabled={!profile?.phoneVerified}
                    />
                  </label>
                  {!profile?.phoneVerified && preferences?.smsNotifications && (
                    <p className="text-xs text-amber-600 ml-4">
                      Please verify your phone number to enable SMS notifications
                    </p>
                  )}
                </div>
              </div>

              {/* Notification Types */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Notification Types</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-gray-900 font-medium">Payment Reminders</span>
                      <p className="text-sm text-gray-500">Get reminded before upcoming payments</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences?.paymentReminders || false}
                      onChange={() => handleNotificationChange('paymentReminders')}
                      className="w-5 h-5 text-brand-teal focus:ring-brand-teal rounded"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-gray-900 font-medium">Payment Confirmations</span>
                      <p className="text-sm text-gray-500">Get notified when payments are processed</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences?.paymentConfirmations || false}
                      onChange={() => handleNotificationChange('paymentConfirmations')}
                      className="w-5 h-5 text-brand-teal focus:ring-brand-teal rounded"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-gray-900 font-medium">Subscription Updates</span>
                      <p className="text-sm text-gray-500">Get notified about subscription changes</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences?.subscriptionUpdates || false}
                      onChange={() => handleNotificationChange('subscriptionUpdates')}
                      className="w-5 h-5 text-brand-teal focus:ring-brand-teal rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          {isAuthenticated && user && (
            <div className="card">
              <h2 className="text-xl font-semibold text-brand-navy mb-4">Account Information</h2>
              <div className="space-y-4">
                {/* User Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-brand-teal text-white rounded-full text-sm font-medium">
                      {user.role}
                    </span>
                    {user.emailVerified && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Wallet Address (if connected via wallet auth) */}
                {user.walletAddress && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Linked Wallet Address
                    </label>
                    <div className="input-field bg-gray-50 font-mono text-sm break-all">
                      {user.walletAddress}
                    </div>
                  </div>
                )}

                {/* User ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                  <div className="input-field bg-gray-50 font-mono text-sm">
                    {user.id}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold text-brand-navy mb-4">Account Actions</h2>
            <div className="space-y-3">
              {isAuthenticated && (
                <>
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-left font-medium flex items-center justify-between"
                  >
                    <span>Sign Out</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>

                  {/* Change Password (only for email accounts) */}
                  {user?.email && !user?.walletAddress && (
                    <button
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-left font-medium flex items-center justify-between"
                    >
                      <span>Change Password</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </button>
                  )}
                </>
              )}

              {/* Disconnect Wallet */}
              {isConnected && (
                <button
                  onClick={handleDisconnectWallet}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-left font-medium flex items-center justify-between"
                >
                  <span>Disconnect Wallet</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
              )}

              {/* Sign In Prompt (if not authenticated) */}
              {!isAuthenticated && (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-4 py-3 bg-brand-teal text-white hover:bg-brand-teal-dark rounded-lg transition-colors text-left font-medium flex items-center justify-between"
                >
                  <span>Sign In to Your Account</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallets Tab Content */}
      {activeTab === 'wallets' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-brand-navy mb-2">Connected Wallets</h2>
            <p className="text-gray-600">
              Manage your connected wallets and view their balances
            </p>
          </div>

          {loadingWallets ? (
            <SkeletonList count={3} />
          ) : connectedWallets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-navy mb-2">
                No Connected Wallets
              </h3>
              <p className="text-gray-600 mb-6">
                Connect a wallet to start making payments
              </p>
              <button
                onClick={() => setShowConnectModal(true)}
                className="btn-primary"
              >
                Connect A Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected Wallets List */}
              {connectedWallets.map((wallet) => (
                <WalletCard key={wallet.id} wallet={wallet} />
              ))}

              {/* Connect Another Wallet Button */}
              <div className="card bg-gray-50 border-2 border-dashed border-gray-300 hover:border-brand-teal transition-colors">
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="w-full flex items-center justify-center gap-3 py-4 text-brand-teal hover:text-brand-teal-dark font-medium transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Connect A Wallet
                </button>
              </div>

          {/* Receive-Only Wallet Addresses Section */}
          <div className="mt-10">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-brand-navy mb-2">Receive-Only Wallet Addresses</h2>
              <p className="text-gray-600">Saved addresses to receive payments. These cannot initiate transactions.</p>
            </div>

            <div className="mb-4">
              <button onClick={openAddAddressModal} className="btn-primary">Add Address</button>
            </div>

            {loadingReceiveWallets ? (
              <SkeletonList count={2} />
            ) : receiveWallets.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-brand-navy mb-1">No Receive-Only Addresses</h3>
                <p className="text-gray-600">Add an address to receive subscription payments.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receiveWallets.map(w => (
                  <ReceiveOnlyWalletCard key={w.id} wallet={w} onEdit={openEditAddressModal} onDelete={handleDeleteAddress} />
                ))}
              </div>
            )}
          </div>
            </div>
          )}

          {/* Connect Wallet Modal Placeholder */}
          {showConnectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-strong max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-brand-navy">Connect A Wallet</h3>
                  <button
                    onClick={() => setShowConnectModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Wallet connection functionality will be implemented here.
                  </p>
                  <p className="text-sm text-gray-500">
                    Users will be able to connect additional wallets using wallet signatures for verification.
                  </p>
                </div>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="btn-secondary w-full"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Receive-Only Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-strong max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-brand-navy">{editingAddress ? 'Edit Address' : 'Add Address'}</h3>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                  placeholder="0x..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={addressForm.currency}
                    onChange={(e) => setAddressForm({ ...addressForm, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                  >
                    <option value="PYUSD">PYUSD</option>
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                    placeholder="e.g., Main Wallet"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                  <select
                    value={addressForm.addressType}
                    onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value as 'WALLET' | 'CUSTODIAL' | 'EXCHANGE' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                  >
                    <option value="WALLET">Wallet</option>
                    <option value="CUSTODIAL">Custodial</option>
                    <option value="EXCHANGE">Exchange</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 mt-6 sm:mt-0">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-5 h-5 text-brand-teal focus:ring-brand-teal rounded"
                  />
                  <span className="text-sm text-gray-700">Set as default</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAddressModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submitAddressForm} className="btn-primary flex-1">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions Tab Content */}
      {activeTab === 'subscriptions' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-brand-navy mb-2">My Subscriptions</h2>
            <p className="text-gray-600">
              View and manage your active and past subscriptions
            </p>
          </div>

          {subscriptionsLoading ? (
            <SkeletonList count={3} />
          ) : (subscriptions.sent.length + subscriptions.received.length) === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-navy mb-2">
                No Subscriptions
              </h3>
              <p className="text-gray-600 mb-6">
                You don't have any subscriptions yet
              </p>
              <a href="/create" className="btn-primary inline-block">
                Set Up Payment
              </a>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Active Subscriptions */}
              {(() => {
                const allSubs = [...subscriptions.sent, ...subscriptions.received].map(convertSubscription);
                const activeSubs = allSubs.filter(s => s.isActive);
                return activeSubs.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-brand-navy mb-4">
                      Active ({activeSubs.length})
                    </h3>
                    <div className="space-y-4">
                      {activeSubs.map((subscription) => (
                        <SubscriptionCard key={subscription.id} subscription={subscription} isActive={true} />
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Past Subscriptions */}
              {(() => {
                const allSubs = [...subscriptions.sent, ...subscriptions.received].map(convertSubscription);
                const pastSubs = allSubs.filter(s => !s.isActive);
                return pastSubs.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-brand-navy mb-4">
                      Past ({pastSubs.length})
                    </h3>
                    <div className="space-y-4 opacity-60">
                      {pastSubs.map((subscription) => (
                        <SubscriptionCard key={subscription.id} subscription={subscription} isActive={false} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Payment History Tab Content */}
      {activeTab === 'history' && (
        <div>
          {allPaymentsLoading ? (
            <SkeletonList count={5} />
          ) : allPayments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-brand-navy mb-2">
                No Payment History
              </h2>
              <p className="text-gray-600">
                Your payment history will appear here once you have active rent payments
              </p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card">
                  <div className="text-sm text-gray-600 mb-1">Total Payments</div>
                  <div className="text-3xl font-bold text-brand-navy">{allPayments.length}</div>
                </div>
                <div className="card">
                  <div className="text-sm text-gray-600 mb-1">Completed</div>
                  <div className="text-3xl font-bold text-green-600">
                    {allPayments.filter((p: any) => p.status === 'COMPLETED').length}
                  </div>
                </div>
                <div className="card">
                  <div className="text-sm text-gray-600 mb-1">Failed</div>
                  <div className="text-3xl font-bold text-red-600">
                    {allPayments.filter((p: any) => p.status === 'FAILED').length}
                  </div>
                </div>
                <div className="card">
                  <div className="text-sm text-gray-600 mb-1">Pending</div>
                  <div className="text-3xl font-bold text-yellow-600">
                    {allPayments.filter((p: any) => p.status === 'PENDING').length}
                  </div>
                </div>
              </div>

              {/* Payment Table */}
              <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allPayments.map(payment => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(new Date(payment.createdAt).getTime())}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-800' 
                                : payment.status === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {payment.subscription?.serviceName || 'Unknown Service'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPYUSD(BigInt(payment.amount))} <span className="text-xs text-gray-500">PYUSD</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {payment.transactionHash ? (
                              <a
                                href={getEtherscanLink(payment.transactionHash, 'tx')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-teal hover:text-brand-teal-dark font-medium"
                              >
                                {payment.transactionHash.slice(0, 10)}...
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

