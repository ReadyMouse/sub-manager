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
        <div className="text-6xl mb-4">👛</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Wallet Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Wallet</h2>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contract</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">SubChain Contract</span>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Automation</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Payment Processing</span>
            <AutomationStatus provider={null} />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Automated payment processing will be enabled when configured
          </p>
        </div>

        {/* About */}
        <div className="card bg-gradient-to-r from-blue-600 to-green-500 text-white">
          <h2 className="text-xl font-semibold mb-2">About SubChain</h2>
          <p className="text-sm opacity-90 mb-4">
            Direct wallet-to-wallet recurring payments with PYUSD - The crypto ACH for subscriptions
          </p>
          <div className="flex gap-4 text-sm">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100">
              📚 Documentation
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100">
              🐙 GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

