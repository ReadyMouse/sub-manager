import { useAccount } from 'wagmi';
import { useEnvioUserSubscriptions, parseEnvioSubscription } from '../hooks/useEnvio';
import { useSubChainContract } from '../hooks/useContract';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { BalanceWarning } from '../components/BalanceWarning';
import { SkeletonGrid } from '../components/Skeleton';
import { usePYUSDBalance } from '../hooks/useContract';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { useMemo } from 'react';

export const MySubscriptions: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { subscriptions, loading, refetch } = useEnvioUserSubscriptions(address);
  const { cancelSubscription } = useSubChainContract();
  const { balance } = usePYUSDBalance(address);
  const toast = useToast();

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

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👛</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600">
          Connect your wallet to view and manage your subscriptions
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Subscriptions</h1>
        <SkeletonGrid count={3} />
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.isActive);
  const cancelledSubscriptions = subscriptions.filter(s => !s.isActive);

  return (
    <div>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Subscriptions</h1>
        <button
          onClick={() => refetch()}
          className="btn-secondary text-sm"
        >
          🔄 Refresh
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
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Subscriptions Yet
          </h2>
          <p className="text-gray-600 mb-4">
            Start subscribing to your favorite services with crypto
          </p>
          <a href="/" className="btn-primary inline-block">
            Browse Marketplace
          </a>
        </div>
      ) : (
        <>
          {/* Active Subscriptions */}
          {activeSubscriptions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
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

