import { getAddress } from 'viem';

// Contract addresses with proper checksumming
export const CONTRACTS = {
  // Updated by deployment script when using local Hardhat
  StableRentSubscription: getAddress(import.meta.env.VITE_CONTRACT_ADDRESS || '0x278dD89e80B01772affcC8cAEa6e45fFF8Ae3339'),
  // PYUSD token address (Sepolia Testnet) - properly checksummed
  PYUSD: getAddress(import.meta.env.VITE_PYUSD_ADDRESS || '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9'),
} as const;

// Network configuration
export const SUPPORTED_CHAINS = {
  mainnet: 1,
  sepolia: 11155111,
  localhost: 31337,  // Hardhat local network
} as const;

export const DEFAULT_CHAIN = 
  import.meta.env.VITE_DEFAULT_CHAIN === 'mainnet' 
    ? SUPPORTED_CHAINS.mainnet 
    : import.meta.env.VITE_DEFAULT_CHAIN === 'localhost'
    ? SUPPORTED_CHAINS.localhost
    : SUPPORTED_CHAINS.sepolia;

// Envio GraphQL endpoint
export const ENVIO_GRAPHQL_ENDPOINT = 
  import.meta.env.VITE_ENVIO_ENDPOINT || 'http://localhost:8080/graphql';

// PYUSD configuration
export const PYUSD_DECIMALS = 6;
export const PYUSD_SYMBOL = 'PYUSD';
export const PYUSD_NAME = 'PayPal USD';

// Processor fee configuration - will be fetched from backend
export const PROCESSOR_FEE_CURRENCY = 'PYUSD';
export const PROCESSOR_FEE_ID = '0';

// Payment intervals (in seconds)
export const PAYMENT_INTERVALS = {
  DAILY: 86400,
  WEEKLY: 604800,
  MONTHLY: 2592000, // 30 days
  YEARLY: 31536000, // 365 days
} as const;

// Popular services (for marketplace)
export const POPULAR_SERVICES = [
  {
    id: 'netflix',
    name: 'Netflix',
    description: 'Stream unlimited movies and TV shows',
    logo: '🎬',
    price: 15.49,
    interval: PAYMENT_INTERVALS.MONTHLY,
    category: 'Entertainment',
  },
  {
    id: 'spotify',
    name: 'Spotify Premium',
    description: 'Music streaming with no ads',
    logo: '🎵',
    price: 10.99,
    interval: PAYMENT_INTERVALS.MONTHLY,
    category: 'Entertainment',
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    description: 'Access millions of songs',
    logo: '🎼',
    price: 10.99,
    interval: PAYMENT_INTERVALS.MONTHLY,
    category: 'Entertainment',
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    description: 'Ad-free videos and background play',
    logo: '📺',
    price: 13.99,
    interval: PAYMENT_INTERVALS.MONTHLY,
    category: 'Entertainment',
  },
  {
    id: 'adobe-creative',
    name: 'Adobe Creative Cloud',
    description: 'All Adobe creative apps',
    logo: '🎨',
    price: 54.99,
    interval: PAYMENT_INTERVALS.MONTHLY,
    category: 'Productivity',
  },
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    description: 'Office apps and cloud storage',
    logo: '📊',
    price: 9.99,
    interval: PAYMENT_INTERVALS.MONTHLY,
    category: 'Productivity',
  },
] as const;

// Wallet configuration
export const WALLET_CONFIG = {
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '',
  appName: 'StableRent',
  appDescription: 'Professional Crypto Rent Payment Platform',
  appUrl: 'https://stablerent.app',
  appIcon: 'https://stablerent.app/icon.png',
} as const;

// Transaction settings
export const TX_SETTINGS = {
  confirmations: 1,
  timeout: 60000, // 60 seconds
} as const;

// UI Constants
export const TOAST_DURATION = 5000; // 5 seconds
export const SKELETON_COUNT = 3; // Number of skeleton loaders to show

// Date formatting
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm';

