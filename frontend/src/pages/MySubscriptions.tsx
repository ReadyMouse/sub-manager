import { useAccount } from 'wagmi';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEnvioUserSubscriptions, parseEnvioSubscription } from '../hooks/useEnvio';
import { useStableRentContract } from '../hooks/useContract';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { BalanceWarning } from '../components/BalanceWarning';
import { SkeletonGrid } from '../components/Skeleton';
import { usePYUSDBalance } from '../hooks/useContract';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { formatPYUSD, formatDate, formatDateTime, getIntervalLabel } from '../lib/utils';
import { PYUSD_SYMBOL } from '../lib/constants';
import { useMemo } from 'react';

export const MySubscriptions: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { subscriptions, loading, refetch } = useEnvioUserSubscriptions(address);
  const { cancelSubscription } = useStableRentContract();
  const { balance } = usePYUSDBalance(address);
  const toast = useToast();

  const subscriptionId = searchParams.get('id');

  // Find the specific subscription if ID is provided
  const selectedSubscription = useMemo(() => {
    if (!subscriptionId || !subscriptions.length) return null;
    return subscriptions.find(sub => sub.id === subscriptionId);
  }, [subscriptionId, subscriptions]);

  const parsedSelectedSubscription = useMemo(() => {
    if (!selectedSubscription) return null;
    return parseEnvioSubscription(selectedSubscription);
  }, [selectedSubscription]);

  // Calculate balance warning
  const balanceWarning = useMemo(() => {
    if (!balance || subscriptions.length === 0) {
      return { isWarning: false, currentBalance: 0n, upcomingPayment: 0n, shortfall: 0n };
    }

    const activeSubscriptions = subscriptions.filter(s => s.isActive);
    const upcomingPayment = activeSubscriptions.reduce((total, sub) => {
      const parsed = parseEnvioSubscription(sub);
      return total + parsed.amount;
    }, 0n);

    return {
      isWarning: balance < upcomingPayment,
      currentBalance: balance,
      upcomingPayment,
      shortfall: upcomingPayment > balance ? upcomingPayment - balance : 0n,
    };
  }, [balance, subscriptions]);

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    try {
      await cancelSubscription(BigInt(subscriptionId));
      toast.success('Success', 'Subscription cancelled successfully');
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Error', 'Failed to cancel subscription');
    }
  };

  const handleCancelSelected = async () => {
    if (!parsedSelectedSubscription || !confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    try {
      await cancelSubscription(BigInt(parsedSelectedSubscription.id));
      toast.success('Success', 'Subscription cancelled successfully');
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Error', 'Failed to cancel subscription');
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
          Connect your wallet to view and manage your rent payments
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-brand-navy mb-6">My Rent Payments</h1>
        <SkeletonGrid count={3} />
      </div>
    );
  }

  // If a specific subscription ID is provided, show details view
  if (subscriptionId) {
    if (!selectedSubscription || !parsedSelectedSubscription) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-brand-navy mb-2">
            Subscription Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The subscription you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/subscriptions')}
            className="btn-primary"
          >
            View All Subscriptions
          </button>
        </div>
      );
    }

    const isOverdue = parsedSelectedSubscription.isActive && parsedSelectedSubscription.nextPaymentDue < Math.floor(Date.now() / 1000);
    const isDueSoon = parsedSelectedSubscription.isActive && parsedSelectedSubscription.nextPaymentDue > Math.floor(Date.now() / 1000) && 
      (parsedSelectedSubscription.nextPaymentDue - Math.floor(Date.now() / 1000)) <= 86400;

    return (
      <div>
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">Subscription Details</h1>
            <p className="text-gray-600 mt-1">ID: {selectedSubscription.id}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/subscriptions')}
              className="btn-secondary"
            >
              ← Back to Subscriptions
            </button>
            {parsedSelectedSubscription.isActive && (
              <button
                onClick={handleCancelSelected}
                className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-brand-navy mb-4">Service Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Service Name</label>
                  <p className="text-lg font-semibold text-brand-navy">{selectedSubscription.serviceProviderId}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Subscription ID</label>
                  <p className="text-sm font-mono text-gray-700">{selectedSubscription.id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <div className="flex items-center gap-2">
                    {parsedSelectedSubscription.isActive ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                        Inactive
                      </span>
                    )}
                    {isOverdue && (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                        Overdue
                      </span>
                    )}
                    {isDueSoon && !isOverdue && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                        Due Soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="card">
              <h2 className="text-xl font-semibold text-brand-navy mb-4">Payment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Amount per Payment</label>
                  <p className="text-2xl font-bold text-brand-navy">
                    {formatPYUSD(parsedSelectedSubscription.amount)} {PYUSD_SYMBOL}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Frequency</label>
                  <p className="text-lg font-semibold text-brand-navy">
                    {getIntervalLabel(parsedSelectedSubscription.interval)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Next Payment Due</label>
                  <p className={`text-lg font-semibold ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-brand-navy'}`}>
                    {parsedSelectedSubscription.isActive ? formatDate(parsedSelectedSubscription.nextPaymentDue) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Payments Made</label>
                  <p className="text-lg font-semibold text-brand-navy">
                    {parsedSelectedSubscription.paymentCount}
                    {parsedSelectedSubscription.maxPayments ? ` / ${parsedSelectedSubscription.maxPayments}` : ''}
                  </p>
                </div>
                {parsedSelectedSubscription.failedPaymentCount > 0 && (
                  <div>
                    <label className="text-sm text-gray-600">Failed Payments</label>
                    <p className="text-lg font-semibold text-red-600">
                      {parsedSelectedSubscription.failedPaymentCount} / 3
                    </p>
                  </div>
                )}
                {parsedSelectedSubscription.endDate && parsedSelectedSubscription.endDate > 0 && (
                  <div>
                    <label className="text-sm text-gray-600">End Date</label>
                    <p className="text-lg font-semibold text-brand-navy">
                      {formatDate(parsedSelectedSubscription.endDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-brand-navy mb-4">Wallet Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Your Wallet Address</label>
                  <p className="text-sm font-mono text-gray-700 break-all">{selectedSubscription.subscriber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Recipient Wallet Address</label>
                  <p className="text-sm font-mono text-gray-700 break-all">
                    {selectedSubscription.recipientAddress || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Processor Fee Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-brand-navy mb-4">Processor Fee Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Processor Fee</label>
                  <p className="text-lg font-semibold text-brand-navy">
                    {formatPYUSD(parsedSelectedSubscription.processorFee)} {PYUSD_SYMBOL}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Total per Payment (Amount + Fee)</label>
                  <p className="text-xl font-bold text-brand-navy">
                    {formatPYUSD(parsedSelectedSubscription.amount + parsedSelectedSubscription.processorFee)} {PYUSD_SYMBOL}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Fee Address</label>
                  <p className="text-sm font-mono text-gray-700 break-all">
                    {selectedSubscription.processorFeeAddress || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="card">
              <h3 className="text-lg font-semibold text-brand-navy mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(parsedSelectedSubscription.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDateTime(parsedSelectedSubscription.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Chain ID</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedSubscription.chainId || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-brand-navy mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => refetch()}
                  className="w-full btn-secondary"
                >
                  Refresh Data
                </button>
                {parsedSelectedSubscription.isActive && (
                  <button
                    onClick={handleCancelSelected}
                    className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>

            {/* Blockchain Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-brand-navy mb-4">Blockchain Info</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Contract Address</label>
                  <p className="text-xs font-mono text-gray-700 break-all">
                    {process.env.REACT_APP_CONTRACT_ADDRESS || 'Not configured'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Network</label>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedSubscription.chainId === 1 ? 'Ethereum Mainnet' : 
                     selectedSubscription.chainId === 11155111 ? 'Sepolia Testnet' : 
                     `Chain ID ${selectedSubscription.chainId}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.isActive);
  const cancelledSubscriptions = subscriptions.filter(s => !s.isActive);

  return (
    <div>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-brand-navy">My Rent Payments</h1>
        <button
          onClick={() => refetch()}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {/* Balance Warning */}
      {balanceWarning.isWarning && (
        <div className="mb-6">
          <BalanceWarning warning={balanceWarning} />
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-brand-navy mb-2">
            No Rent Payments Configured
          </h2>
          <p className="text-gray-600 mb-4">
            Set up your automated rent payment to get started
          </p>
          <a href="/create" className="btn-primary inline-block">
            Set Up Rent Payment
          </a>
        </div>
      ) : (
        <>
          {/* Active Subscriptions */}
          {activeSubscriptions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-brand-navy mb-4">
                Active ({activeSubscriptions.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeSubscriptions.map(sub => {
                  const parsed = parseEnvioSubscription(sub);
                  return (
                    <SubscriptionCard
                      key={sub.id}
                      subscription={parsed}
                      onCancel={handleCancel}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancelled Subscriptions */}
          {cancelledSubscriptions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-brand-navy mb-4">
                Cancelled ({cancelledSubscriptions.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                {cancelledSubscriptions.map(sub => {
                  const parsed = parseEnvioSubscription(sub);
                  return (
                    <SubscriptionCard
                      key={sub.id}
                      subscription={parsed}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

