import { useAccount } from 'wagmi';
import { usePYUSDBalance } from '../hooks/useContract';
import { formatPYUSD, shortenAddress } from '../lib/utils';
import { PYUSD_SYMBOL, CONTRACTS } from '../lib/constants';
import { AutomationStatus } from '../components/AutomationStatus';

export const Settings: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { balance } = usePYUSDBalance(address);

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
          Connect your wallet to access settings
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-navy mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Wallet Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-brand-navy mb-4">Wallet</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Address</span>
              <span className="font-mono text-sm">{shortenAddress(address || '')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">PYUSD Balance</span>
              <span className="font-semibold">
                {balance ? formatPYUSD(balance) : '0.00'} {PYUSD_SYMBOL}
              </span>
            </div>
          </div>
        </div>

        {/* Contract Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-brand-navy mb-4">Contract Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">StableRent Contract</span>
              <span className="font-mono text-xs">{shortenAddress(CONTRACTS.SubChainSubscription)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">PYUSD Token</span>
              <span className="font-mono text-xs">{shortenAddress(CONTRACTS.PYUSD)}</span>
            </div>
          </div>
        </div>

        {/* Automation Status */}
        <div className="card">
          <h2 className="text-xl font-semibold text-brand-navy mb-4">Automation</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Payment Processing</span>
            <AutomationStatus provider={null} />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Automated payment processing will be enabled when configured
          </p>
        </div>

        {/* About */}
        <div className="card bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-teal text-white shadow-strong">
          <h2 className="text-xl font-semibold mb-3">About StableRent</h2>
          <p className="text-sm opacity-95 mb-4 leading-relaxed">
            Professional crypto rent payment platform using PayPal's PYUSD stablecoin for automated, transparent rent transactions.
          </p>
          <div className="flex gap-4 text-sm">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="opacity-95 hover:opacity-100 underline font-medium">
              Documentation
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="opacity-95 hover:opacity-100 underline font-medium">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

