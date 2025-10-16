import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useEnvioAllUserPayments } from '../hooks/useEnvio';
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

interface UserProfile {
  displayName: string;
  email?: string;
  phoneNumber?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  paymentReminders: boolean;
  paymentConfirmations: boolean;
  subscriptionUpdates: boolean;
}

export const Settings: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { payments, loading: paymentsLoading } = useEnvioAllUserPayments(address);
  const [activeTab, setActiveTab] = useState<'profile' | 'wallets' | 'subscriptions' | 'history'>('profile');
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [subscriptions, setSubscriptions] = useState<EnvioSubscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    displayName: 'User',
    email: '',
    phoneNumber: '',
    phoneVerified: false,
    emailVerified: false,
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    paymentReminders: true,
    paymentConfirmations: true,
    subscriptionUpdates: true,
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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

  // Load subscriptions
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!isConnected) return;
      
      setLoadingSubscriptions(true);
      try {
        // TODO: Replace with actual API call when Envio is integrated
        // For now, using mock data
        const mockSubscriptions: EnvioSubscription[] = [
          {
            id: '1',
            subscriber: address?.toLowerCase() || '',
            serviceProviderId: 'Monthly Rent',
            amount: '2500000000', // $2,500.00 PYUSD (6 decimals)
            interval: '2592000', // 30 days in seconds
            nextPaymentDue: String(Math.floor(Date.now() / 1000) + 86400 * 5), // 5 days from now
            isActive: true,
            failedPaymentCount: '0',
            createdAt: String(Math.floor(Date.now() / 1000) - 86400 * 60), // 60 days ago
            paymentCount: '2',
            processorFee: '25000000', // $25.00
            processorFeeAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
            processorFeeCurrency: 'PYUSD',
            processorFeeID: 'rental-001',
          },
          {
            id: '2',
            subscriber: address?.toLowerCase() || '',
            serviceProviderId: 'Storage Unit',
            amount: '150000000', // $150.00 PYUSD
            interval: '2592000', // 30 days
            nextPaymentDue: String(Math.floor(Date.now() / 1000) + 86400 * 12), // 12 days from now
            isActive: true,
            failedPaymentCount: '0',
            createdAt: String(Math.floor(Date.now() / 1000) - 86400 * 90), // 90 days ago
            paymentCount: '3',
            processorFee: '1500000', // $1.50
            processorFeeAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
            processorFeeCurrency: 'PYUSD',
            processorFeeID: 'storage-001',
          },
          {
            id: '3',
            subscriber: address?.toLowerCase() || '',
            serviceProviderId: 'Old Apartment',
            amount: '1800000000', // $1,800.00 PYUSD
            interval: '2592000', // 30 days
            nextPaymentDue: String(Math.floor(Date.now() / 1000) - 86400 * 30), // 30 days ago (past)
            isActive: false,
            failedPaymentCount: '0',
            createdAt: String(Math.floor(Date.now() / 1000) - 86400 * 365), // 365 days ago
            endDate: String(Math.floor(Date.now() / 1000) - 86400 * 60), // Ended 60 days ago
            paymentCount: '10',
            processorFee: '18000000', // $18.00
            processorFeeAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
            processorFeeCurrency: 'PYUSD',
            processorFeeID: 'rental-002',
          },
        ];
        setSubscriptions(mockSubscriptions);
      } catch (error) {
        console.error('Failed to load subscriptions:', error);
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    loadSubscriptions();
  }, [isConnected, address]);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!isConnected) return;
      
      try {
        // TODO: Replace with actual API call to backend
        // For now, using mock data
        const mockProfile: UserProfile = {
          displayName: 'John Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1 (555) 123-4567',
          phoneVerified: true,
          emailVerified: true,
        };
        setUserProfile(mockProfile);

        // Load notification settings
        const mockSettings: NotificationSettings = {
          emailNotifications: true,
          smsNotifications: true,
          paymentReminders: true,
          paymentConfirmations: true,
          subscriptionUpdates: true,
        };
        setNotificationSettings(mockSettings);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    };

    loadProfile();
  }, [isConnected, address]);

  const handleProfileUpdate = async () => {
    // TODO: Implement profile update API call
    console.log('Updating profile:', userProfile);
    setIsEditingProfile(false);
  };

  const handleVerifyPhone = async () => {
    // TODO: Implement phone verification
    console.log('Verify phone:', userProfile.phoneNumber);
  };

  const handleVerifyEmail = async () => {
    // TODO: Implement email verification
    console.log('Verify email:', userProfile.email);
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    // TODO: Save to backend
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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Success</span>;
      case 'failed':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Failed</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">Pending</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const getDirectionBadge = (direction: 'sent' | 'received') => {
    if (direction === 'sent') {
      return (
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Sent
        </span>
      );
    }
    return (
      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        Received
      </span>
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-navy mb-6">Profile</h1>

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
                    value={userProfile.displayName}
                    onChange={(e) => setUserProfile({ ...userProfile, displayName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{userProfile.displayName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center gap-2">
                  {isEditingProfile ? (
                    <input
                      type="email"
                      value={userProfile.email || ''}
                      onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  ) : (
                    <p className="flex-1 text-gray-900">{userProfile.email || 'Not provided'}</p>
                  )}
                  {userProfile.email && (
                    userProfile.emailVerified ? (
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
                      value={userProfile.phoneNumber || ''}
                      onChange={(e) => setUserProfile({ ...userProfile, phoneNumber: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  ) : (
                    <p className="flex-1 text-gray-900">{userProfile.phoneNumber || 'Not provided'}</p>
                  )}
                  {userProfile.phoneNumber && (
                    userProfile.phoneVerified ? (
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
                      checked={notificationSettings.emailNotifications}
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
                      checked={notificationSettings.smsNotifications}
                      onChange={() => handleNotificationChange('smsNotifications')}
                      className="w-5 h-5 text-brand-teal focus:ring-brand-teal rounded"
                      disabled={!userProfile.phoneVerified}
                    />
                  </label>
                  {!userProfile.phoneVerified && notificationSettings.smsNotifications && (
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
                      checked={notificationSettings.paymentReminders}
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
                      checked={notificationSettings.paymentConfirmations}
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
                      checked={notificationSettings.subscriptionUpdates}
                      onChange={() => handleNotificationChange('subscriptionUpdates')}
                      className="w-5 h-5 text-brand-teal focus:ring-brand-teal rounded"
                    />
                  </label>
                </div>
              </div>
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

      {/* Subscriptions Tab Content */}
      {activeTab === 'subscriptions' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-brand-navy mb-2">My Subscriptions</h2>
            <p className="text-gray-600">
              View and manage your active and past subscriptions
            </p>
          </div>

          {loadingSubscriptions ? (
            <SkeletonList count={3} />
          ) : subscriptions.length === 0 ? (
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
              {subscriptions.filter(s => s.isActive).length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-brand-navy mb-4">
                    Active ({subscriptions.filter(s => s.isActive).length})
                  </h3>
                  <div className="space-y-4">
                    {subscriptions
                      .filter(s => s.isActive)
                      .map((subscription) => (
                        <SubscriptionCard key={subscription.id} subscription={subscription} isActive={true} />
                      ))}
                  </div>
                </div>
              )}

              {/* Past Subscriptions */}
              {subscriptions.filter(s => !s.isActive).length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-brand-navy mb-4">
                    Past ({subscriptions.filter(s => !s.isActive).length})
                  </h3>
                  <div className="space-y-4 opacity-60">
                    {subscriptions
                      .filter(s => !s.isActive)
                      .map((subscription) => (
                        <SubscriptionCard key={subscription.id} subscription={subscription} isActive={false} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment History Tab Content */}
      {activeTab === 'history' && (
        <div>
          {paymentsLoading ? (
            <SkeletonList count={5} />
          ) : payments.length === 0 ? (
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
                  <div className="text-3xl font-bold text-brand-navy">{payments.length}</div>
                </div>
                <div className="card">
                  <div className="text-sm text-gray-600 mb-1">Sent</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {payments.filter(p => p.direction === 'sent').length}
                  </div>
                </div>
                <div className="card">
                  <div className="text-sm text-gray-600 mb-1">Received</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {payments.filter(p => p.direction === 'received').length}
                  </div>
                </div>
                <div className="card">
                  <div className="text-sm text-gray-600 mb-1">Successful</div>
                  <div className="text-3xl font-bold text-green-600">
                    {payments.filter(p => p.status.toLowerCase() === 'success').length}
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
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payments.map(payment => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(parseInt(payment.timestamp))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getDirectionBadge(payment.direction)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {payment.serviceName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPYUSD(BigInt(payment.amount))} <span className="text-xs text-gray-500">PYUSD</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(payment.status)}
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

