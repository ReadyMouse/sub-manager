import { useAccount } from 'wagmi';
import { useEnvioAllUserPayments } from '../hooks/useEnvio';
import { SkeletonList } from '../components/Skeleton';
import { formatPYUSD, formatDateTime, getEtherscanLink } from '../lib/utils';

export const PaymentHistory: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { payments, loading } = useEnvioAllUserPayments(address);

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
          Connect your wallet to view your payment history
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-brand-navy mb-6">Payment History</h1>
        <SkeletonList count={5} />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-brand-navy mb-6">Payment History</h1>
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
      <h1 className="text-3xl font-bold text-brand-navy mb-6">Payment History</h1>

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
    </div>
  );
};

