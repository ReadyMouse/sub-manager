import { useAccount } from 'wagmi';
import { useEnvioUserPayments } from '../hooks/useEnvio';
import { SkeletonList } from '../components/Skeleton';
import { formatPYUSD, formatDateTime, getEtherscanLink } from '../lib/utils';
import { PYUSD_SYMBOL } from '../lib/constants';

export const PaymentHistory: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { payments, loading } = useEnvioUserPayments(address);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👛</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600">
          Connect your wallet to view your payment history
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Payment History</h1>
        <SkeletonList count={5} />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Payment History</h1>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💸</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Payments Yet
          </h2>
          <p className="text-gray-600">
            Your payment history will appear here once you have active subscriptions
          </p>
        </div>
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Payment History</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Total Payments</div>
          <div className="text-3xl font-bold text-gray-900">{payments.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Successful</div>
          <div className="text-3xl font-bold text-green-600">
            {payments.filter(p => p.status.toLowerCase() === 'success').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Failed</div>
          <div className="text-3xl font-bold text-red-600">
            {payments.filter(p => p.status.toLowerCase() === 'failed').length}
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {payment.subscriptionId.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatPYUSD(BigInt(payment.amount))} {PYUSD_SYMBOL}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a
                      href={getEtherscanLink(payment.transactionHash, 'tx')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-paypal-blue hover:text-paypal-blue-dark font-medium"
                    >
                      {payment.transactionHash.slice(0, 10)}...
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

