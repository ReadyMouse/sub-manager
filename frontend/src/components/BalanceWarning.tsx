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
        <div className="flex-shrink-0 mr-3">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
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

