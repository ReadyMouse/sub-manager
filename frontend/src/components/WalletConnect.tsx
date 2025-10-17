import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { SUPPORTED_CHAINS } from '../lib/constants';

export const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const isWrongNetwork = isConnected && 
    chainId !== SUPPORTED_CHAINS.mainnet && 
    chainId !== SUPPORTED_CHAINS.sepolia &&
    chainId !== SUPPORTED_CHAINS.localhost;

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {/* Network Warning */}
        {isWrongNetwork && (
          <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
            Wrong Network
          </div>
        )}

        {/* Wallet Address Display */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
          <span className="text-green-500">●</span>
          <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
        </div>
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

