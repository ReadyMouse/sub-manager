import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { usePYUSDBalance } from '../hooks/useContract';
import { shortenAddress, formatPYUSD } from '../lib/utils';
import { PYUSD_SYMBOL, SUPPORTED_CHAINS } from '../lib/constants';

export const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { balance, isLoading: isLoadingBalance } = usePYUSDBalance(address);

  const isWrongNetwork = isConnected && 
    chainId !== SUPPORTED_CHAINS.mainnet && 
    chainId !== SUPPORTED_CHAINS.sepolia;

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {/* PYUSD Balance */}
        <div className="hidden md:flex items-center gap-2 bg-pyusd-green-light bg-opacity-20 px-3 py-2 rounded-lg">
          <span className="text-sm font-medium text-pyusd-green-dark">
            {isLoadingBalance ? (
              <span className="animate-pulse">Loading...</span>
            ) : balance !== undefined ? (
              `${formatPYUSD(balance)} ${PYUSD_SYMBOL}`
            ) : (
              '0.00 PYUSD'
            )}
          </span>
        </div>

        {/* Network Warning */}
        {isWrongNetwork && (
          <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
            Wrong Network
          </div>
        )}

        {/* Connected Address */}
        <div className="bg-gray-100 px-3 py-2 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
            {shortenAddress(address)}
          </span>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={() => disconnect()}
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Just show MetaMask button (use first available connector)
  const primaryConnector = connectors.find(c => c.name === 'MetaMask') || connectors[0];
  
  if (!primaryConnector) {
    return null;
  }

  return (
    <button
      onClick={() => connect({ connector: primaryConnector })}
      className="btn-primary"
    >
      {primaryConnector.name === 'MetaMask' ? 'Connect MetaMask' : 'Connect Wallet'}
    </button>
  );
};

