import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useEnvioUserSubscriptions, parseEnvioSubscription } from '../hooks/useEnvio';
import { useStableRentContract } from '../hooks/useContract';
import { formatPYUSD, formatDate, formatDateTime, getIntervalLabel } from '../lib/utils';
import { PYUSD_SYMBOL } from '../lib/constants';
import { SkeletonGrid } from '../components/Skeleton';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { useMemo } from 'react';

export const SubscriptionDetails: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { subscriptions, loading, refetch } = useEnvioUserSubscriptions(address);
  const { cancelSubscription } = useStableRentContract();
  const toast = useToast();

  const subscriptionId = searchParams.get('id');

  // Find the specific subscription
  const subscription = useMemo(() => {
    if (!subscriptionId || !subscriptions.length) return null;
    return subscriptions.find(sub => sub.id === subscriptionId);
  }, [subscriptionId, subscriptions]);

  const parsedSubscription = useMemo(() => {
    if (!subscription) return null;
    return parseEnvioSubscription(subscription);
  }, [subscription]);

  const handleCancel = async () => {
    if (!parsedSubscription || !confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    try {
      await cancelSubscription(BigInt(parsedSubscription.id));
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
          Connect your wallet to view subscription details
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-brand-navy mb-6">Subscription Details</h1>
        <SkeletonGrid count={1} />
      </div>
    );
  }

  if (!subscriptionId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-brand-navy mb-2">
          No Subscription Selected
        </h2>
        <p className="text-gray-600 mb-4">
          Please select a subscription to view its details
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

  if (!subscription || !parsedSubscription) {
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

  const isOverdue = parsedSubscription.isActive && parsedSubscription.nextPaymentDue < Math.floor(Date.now() / 1000);
  const isDueSoon = parsedSubscription.isActive && parsedSubscription.nextPaymentDue > Math.floor(Date.now() / 1000) && 
    (parsedSubscription.nextPaymentDue - Math.floor(Date.now() / 1000)) <= 86400;

  return (
    <div>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Subscription Details</h1>
          <p className="text-gray-600 mt-1">ID: {subscription.id}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/subscriptions')}
            className="btn-secondary"
          >
            ← Back to Subscriptions
          </button>
          {parsedSubscription.isActive && (
            <button
              onClick={handleCancel}
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
                <p className="text-lg font-semibold text-brand-navy">{subscription.serviceProviderId}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Subscription ID</label>
                <p className="text-sm font-mono text-gray-700">{subscription.id}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <div className="flex items-center gap-2">
                  {parsedSubscription.isActive ? (
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
                  {formatPYUSD(parsedSubscription.amount)} {PYUSD_SYMBOL}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Frequency</label>
                <p className="text-lg font-semibold text-brand-navy">
                  {getIntervalLabel(parsedSubscription.interval)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Next Payment Due</label>
                <p className={`text-lg font-semibold ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-brand-navy'}`}>
                  {parsedSubscription.isActive ? formatDate(parsedSubscription.nextPaymentDue) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Payments Made</label>
                <p className="text-lg font-semibold text-brand-navy">
                  {parsedSubscription.paymentCount}
                  {parsedSubscription.maxPayments ? ` / ${parsedSubscription.maxPayments}` : ''}
                </p>
              </div>
              {parsedSubscription.failedPaymentCount > 0 && (
                <div>
                  <label className="text-sm text-gray-600">Failed Payments</label>
                  <p className="text-lg font-semibold text-red-600">
                    {parsedSubscription.failedPaymentCount} / 3
                  </p>
                </div>
              )}
              {parsedSubscription.endDate && parsedSubscription.endDate > 0 && (
                <div>
                  <label className="text-sm text-gray-600">End Date</label>
                  <p className="text-lg font-semibold text-brand-navy">
                    {formatDate(parsedSubscription.endDate)}
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
                <p className="text-sm font-mono text-gray-700 break-all">{subscription.subscriber}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Recipient Wallet Address</label>
                <p className="text-sm font-mono text-gray-700 break-all">
                  {subscription.recipientAddress || 'Not specified'}
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
                  {formatPYUSD(parsedSubscription.processorFee)} {PYUSD_SYMBOL}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Total per Payment (Amount + Fee)</label>
                <p className="text-xl font-bold text-brand-navy">
                  {formatPYUSD(parsedSubscription.amount + parsedSubscription.processorFee)} {PYUSD_SYMBOL}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Fee Address</label>
                <p className="text-sm font-mono text-gray-700 break-all">
                  {subscription.processorFeeAddress || 'Not specified'}
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
                  {formatDate(parsedSubscription.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDateTime(parsedSubscription.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Chain ID</span>
                <span className="text-sm font-medium text-gray-900">
                  {subscription.chainId || 'Unknown'}
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
              {parsedSubscription.isActive && (
                <button
                  onClick={handleCancel}
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
                  {subscription.chainId === 1 ? 'Ethereum Mainnet' : 
                   subscription.chainId === 11155111 ? 'Sepolia Testnet' : 
                   `Chain ID ${subscription.chainId}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
