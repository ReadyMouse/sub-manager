import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, localhost } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { WALLET_CONFIG, DEFAULT_CHAIN, SUPPORTED_CHAINS } from './constants';

// Configure chains based on environment
const chains = [mainnet, sepolia, localhost] as const;

// Create wagmi config
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected(),
    // WalletConnect requires a project ID
    ...(WALLET_CONFIG.projectId 
      ? [walletConnect({ 
          projectId: WALLET_CONFIG.projectId,
        })]
      : []
    ),
  ],
  transports: {
    [mainnet.id]: http(import.meta.env.VITE_MAINNET_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'),
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'),
    [localhost.id]: http(import.meta.env.VITE_LOCALHOST_RPC_URL || 'http://localhost:8545'),
  },
});

// Helper to get current chain
export const getCurrentChain = () => {
  if (DEFAULT_CHAIN === SUPPORTED_CHAINS.mainnet) return mainnet;
  if (DEFAULT_CHAIN === SUPPORTED_CHAINS.localhost) return localhost;
  return sepolia;
};

// Helper to check if chain is supported
export const isSupportedChain = (chainId: number): boolean => {
  return chainId === SUPPORTED_CHAINS.mainnet || 
         chainId === SUPPORTED_CHAINS.sepolia ||
         chainId === SUPPORTED_CHAINS.localhost;
};

