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
      {/* Testnet Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-800 mb-1">
              Testnet Only - Sepolia Network
            </h3>
            <p className="text-sm text-yellow-700">
              This screening tool is currently running on the Sepolia testnet. All balances and transaction history shown are for testnet tokens only and do not reflect mainnet assets.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-navy mb-2">Tenant Screening</h1>
        <p className="text-gray-600">
          Search for wallet balances and view subscription history to screen potential tenants.
        </p>
      </div>

      {/* Blockchain Transparency Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl shadow-medium p-6 mb-8 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-brand-teal rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-brand-navy mb-2">
              Blockchain Transparency for Credit Assessment
            </h3>
            <p className="text-gray-700 mb-3">
              Traditional credit scores don't tell the whole story. Blockchain technology provides an 
              <span className="font-semibold"> immutable and transparent</span> record of financial behavior 
              that can't be altered or hidden.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-brand-navy">Immutable Records</p>
                  <p className="text-sm text-gray-600">
                    Transaction history cannot be deleted or modified, providing an honest financial track record
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-brand-navy">Complete Transparency</p>
                  <p className="text-sm text-gray-600">
                    View real-time account balances and payment patterns for informed screening decisions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-brand-navy">Alternative Credit Assessment</p>
                  <p className="text-sm text-gray-600">
                    Perfect for applicants with limited or no traditional credit history
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-brand-navy">Instant Verification</p>
                  <p className="text-sm text-gray-600">
                    No waiting for credit reports—verify financial responsibility in seconds
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Wallet Balance Search */}
        <div className="bg-white rounded-xl shadow-medium p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-brand-navy mb-1">Check Wallet Balance</h2>
            <p className="text-sm text-gray-600">Enter a wallet address to view balances</p>
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
          <div className="mb-4">
            <h2 className="text-xl font-bold text-brand-navy mb-1">Subscription History</h2>
            <p className="text-sm text-gray-600">Search by username or email</p>
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

