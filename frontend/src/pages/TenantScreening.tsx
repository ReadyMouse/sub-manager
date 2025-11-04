import { useState } from 'react';
import { tenantScreeningApi } from '../lib/api';

interface WalletBalanceData {
  address: string;
  balances: {
    eth: string;
    pyusd: string;
  };
  user: {
    id: string;
    displayName: string;
    email: string | null;
    createdAt: string;
  } | null;
}

interface SubscriptionHistoryData {
  users: Array<{
    id: string;
    displayName: string;
    email: string | null;
    createdAt: string;
  }>;
  subscriptions: {
    sent: any[];
    received: any[];
  };
  statistics: {
    totalActiveSent: number;
    totalActiveReceived: number;
    totalPaymentsMade: number;
    totalPaymentsReceived: number;
    failedPayments: number;
    successRate: number;
  };
  message?: string;
}

export const TenantScreening = () => {
  // Wallet balance search
  const [walletAddress, setWalletAddress] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [walletData, setWalletData] = useState<WalletBalanceData | null>(null);

  // Username search
  const [username, setUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionHistoryData | null>(null);

  const handleWalletSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress.trim()) return;

    setWalletLoading(true);
    setWalletError('');
    setWalletData(null);

    try {
      const data = await tenantScreeningApi.getWalletBalance(walletAddress.trim());
      setWalletData(data);
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : 'Failed to fetch wallet balance');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleUsernameSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setUsernameLoading(true);
    setUsernameError('');
    setSubscriptionData(null);

    try {
      const data = await tenantScreeningApi.getSubscriptionsByUsername(username.trim());
      setSubscriptionData(data);
    } catch (error) {
      setUsernameError(error instanceof Error ? error.message : 'Failed to fetch subscription history');
    } finally {
      setUsernameLoading(false);
    }
  };

  const formatCurrency = (amount: string, decimals: number = 6) => {
    const num = parseFloat(amount);
    return num.toFixed(decimals);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-navy mb-2">Tenant Screening</h1>
        <p className="text-gray-600">
          Search for wallet balances and view subscription history to screen potential tenants.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Wallet Balance Search */}
        <div className="bg-white rounded-xl shadow-medium p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-teal/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-navy">Check Wallet Balance</h2>
              <p className="text-sm text-gray-600">Enter a wallet address to view balances</p>
            </div>
          </div>

          <form onSubmit={handleWalletSearch} className="space-y-4">
            <div>
              <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                id="walletAddress"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                disabled={walletLoading}
              />
            </div>

            <button
              type="submit"
              disabled={walletLoading || !walletAddress.trim()}
              className="w-full px-6 py-3 bg-brand-teal text-white rounded-lg font-medium hover:bg-brand-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {walletLoading ? 'Checking...' : 'Check Balance'}
            </button>
          </form>

          {walletError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{walletError}</p>
            </div>
          )}

          {walletData && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="text-sm font-mono break-all">{walletData.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">ETH Balance</p>
                  <p className="text-lg font-bold text-brand-navy">
                    {formatCurrency(walletData.balances.eth, 4)} ETH
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">PYUSD Balance</p>
                  <p className="text-lg font-bold text-brand-navy">
                    {formatCurrency(walletData.balances.pyusd, 2)} PYUSD
                  </p>
                </div>
              </div>

              {walletData.user && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-gray-500 mb-2">Registered User</p>
                  <p className="text-sm font-semibold text-brand-navy">{walletData.user.displayName}</p>
                  {walletData.user.email && (
                    <p className="text-sm text-gray-600">{walletData.user.email}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Member since {formatDate(walletData.user.createdAt)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Username Search */}
        <div className="bg-white rounded-xl shadow-medium p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-teal/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-navy">Subscription History</h2>
              <p className="text-sm text-gray-600">Search by username or email</p>
            </div>
          </div>

          <form onSubmit={handleUsernameSearch} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                disabled={usernameLoading}
              />
            </div>

            <button
              type="submit"
              disabled={usernameLoading || !username.trim()}
              className="w-full px-6 py-3 bg-brand-teal text-white rounded-lg font-medium hover:bg-brand-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {usernameLoading ? 'Searching...' : 'Search History'}
            </button>
          </form>

          {usernameError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{usernameError}</p>
            </div>
          )}

          {subscriptionData && (
            <div className="mt-6 space-y-4">
              {subscriptionData.message ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">{subscriptionData.message}</p>
                </div>
              ) : (
                <>
                  {/* Users Found */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">
                      Found {subscriptionData.users.length} user(s)
                    </p>
                    {subscriptionData.users.map((user) => (
                      <div key={user.id} className="mb-2 last:mb-0">
                        <p className="text-sm font-semibold text-brand-navy">{user.displayName}</p>
                        {user.email && <p className="text-xs text-gray-600">{user.email}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-500">Active Sent</p>
                      <p className="text-xl font-bold text-brand-navy">
                        {subscriptionData.statistics.totalActiveSent}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-500">Active Received</p>
                      <p className="text-xl font-bold text-brand-navy">
                        {subscriptionData.statistics.totalActiveReceived}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-500">Payments Made</p>
                      <p className="text-xl font-bold text-brand-navy">
                        {subscriptionData.statistics.totalPaymentsMade}
                      </p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-lg">
                      <p className="text-xs text-gray-500">Success Rate</p>
                      <p className="text-xl font-bold text-brand-navy">
                        {subscriptionData.statistics.successRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Subscription List */}
      {subscriptionData && !subscriptionData.message && (
        <div className="bg-white rounded-xl shadow-medium p-6">
          <h3 className="text-xl font-bold text-brand-navy mb-4">Subscription Details</h3>

          {/* Sent Subscriptions */}
          {subscriptionData.subscriptions.sent.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-700 mb-3">Payments Sent</h4>
              <div className="space-y-3">
                {subscriptionData.subscriptions.sent.map((sub) => (
                  <div key={sub.id} className="p-4 border border-gray-200 rounded-lg hover:border-brand-teal transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-brand-navy">{sub.serviceName}</p>
                        <p className="text-sm text-gray-600">
                          To: {sub.recipient?.displayName || sub.recipientWalletAddress}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          sub.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {sub.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Amount: </span>
                        <span className="font-medium">{formatCurrency(sub.amount)} {sub.senderCurrency}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Payments: </span>
                        <span className="font-medium">{sub.paymentCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Failed: </span>
                        <span className="font-medium text-red-600">{sub.failedPaymentCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Created: </span>
                        <span className="font-medium">{formatDate(sub.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Received Subscriptions */}
          {subscriptionData.subscriptions.received.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-3">Payments Received</h4>
              <div className="space-y-3">
                {subscriptionData.subscriptions.received.map((sub) => (
                  <div key={sub.id} className="p-4 border border-gray-200 rounded-lg hover:border-brand-teal transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-brand-navy">{sub.serviceName}</p>
                        <p className="text-sm text-gray-600">
                          From: {sub.sender?.displayName || sub.senderWalletAddress}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          sub.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {sub.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Amount: </span>
                        <span className="font-medium">{formatCurrency(sub.amount)} {sub.recipientCurrency}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Payments: </span>
                        <span className="font-medium">{sub.paymentCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Failed: </span>
                        <span className="font-medium text-red-600">{sub.failedPaymentCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Created: </span>
                        <span className="font-medium">{formatDate(sub.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subscriptionData.subscriptions.sent.length === 0 && subscriptionData.subscriptions.received.length === 0 && (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600">No subscription history found for this user.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

