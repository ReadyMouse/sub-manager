import { formatPYUSD } from '../lib/utils';
import type { BalanceWarning as BalanceWarningType } from '../lib/types';

interface BalanceWarningProps {
  warning: BalanceWarningType;
  onAddFunds?: () => void;
}

export const BalanceWarning: React.FC<BalanceWarningProps> = ({ warning, onAddFunds }) => {
  if (!warning.isWarning) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0 text-2xl mr-3">⚠️</div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-800">
            Insufficient Balance
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Your current PYUSD balance ({formatPYUSD(warning.currentBalance)}) is insufficient
              for upcoming payments ({formatPYUSD(warning.upcomingPayment)}).
            </p>
            <p className="mt-1">
              Shortfall: <span className="font-semibold">{formatPYUSD(warning.shortfall)} PYUSD</span>
            </p>
          </div>
          {onAddFunds && (
            <button
              onClick={onAddFunds}
              className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Add Funds
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

