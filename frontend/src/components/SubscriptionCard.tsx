import type { Subscription } from '../lib/types';
import { formatPYUSD, formatDate, getIntervalLabel, getTimeUntilPayment, isPaymentDueSoon, isPaymentOverdue } from '../lib/utils';
import { PYUSD_SYMBOL } from '../lib/constants';

interface SubscriptionCardProps {
  subscription: Subscription;
  serviceName?: string;
  onCancel?: (subscriptionId: string) => void;
  onViewDetails?: (subscriptionId: string) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  serviceName,
  onCancel,
  onViewDetails,
}) => {
  const isDueSoon = isPaymentDueSoon(subscription.nextPaymentDue);
  const isOverdue = isPaymentOverdue(subscription.nextPaymentDue);

  const getStatusBadge = () => {
    if (!subscription.isActive) {
      return <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">Cancelled</span>;
    }
    if (isOverdue) {
      return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Overdue</span>;
    }
    if (isDueSoon) {
      return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Due Soon</span>;
    }
    return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>;
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-brand-navy">
            {serviceName || subscription.serviceProviderId}
          </h3>
          <p className="text-sm text-gray-500">
            ID: {subscription.id.slice(0, 8)}...
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Amount & Interval */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
        <div>
          <div className="text-sm text-gray-600 mb-1">Amount</div>
          <div className="text-xl font-bold text-brand-navy">
            {formatPYUSD(BigInt(subscription.amount || '0'))} {PYUSD_SYMBOL}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Frequency</div>
          <div className="text-lg font-semibold text-brand-navy">
            {getIntervalLabel(subscription.interval)}
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Next Payment</span>
          <span className={`font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-gray-900'}`}>
            {subscription.isActive ? formatDate(subscription.nextPaymentDue) : 'N/A'}
          </span>
        </div>
        {subscription.isActive && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Time Until Next</span>
            <span className={`font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-gray-900'}`}>
              {getTimeUntilPayment(subscription.nextPaymentDue)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Payments Made</span>
          <span className="font-medium text-gray-900">
            {subscription.paymentCount.toString()}
            {subscription.maxPayments ? ` / ${subscription.maxPayments}` : ''}
          </span>
        </div>
        {subscription.failedPaymentCount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Failed Payments</span>
            <span className="font-medium text-red-600">
              {subscription.failedPaymentCount.toString()} / 3
            </span>
          </div>
        )}
        {subscription.endDate && subscription.endDate !== '0' && subscription.endDate !== '' && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">End Date</span>
            <span className="font-medium text-gray-900">
              {formatDate(subscription.endDate)}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {subscription.isActive && onCancel && (
          <button
            onClick={() => onCancel(subscription.id)}
            className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(subscription.id)}
            className="flex-1 btn-secondary"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

