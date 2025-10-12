// Contract addresses
export const CONTRACTS = {
  // TODO: Update with deployed contract address
  SubChainSubscription: import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  // PYUSD token address (Ethereum Mainnet)
  PYUSD: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8',
} as const;

// Network configuration
export const SUPPORTED_CHAINS = {
  mainnet: 1,
  sepolia: 11155111,
} as const;

export const DEFAULT_CHAIN = import.meta.env.VITE_DEFAULT_CHAIN === 'mainnet' 
  ? SUPPORTED_CHAINS.mainnet 
  : SUPPORTED_CHAINS.sepolia;

// Envio GraphQL endpoint
export const ENVIO_GRAPHQL_ENDPOINT = 
  import.meta.env.VITE_ENVIO_ENDPOINT || 'http://localhost:8080/graphql';

// PayPal configuration
export const PAYPAL_CONFIG = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
  environment: import.meta.env.VITE_PAYPAL_ENV || 'sandbox', // 'sandbox' or 'production'
} as const;

// Backend API endpoint
export const BACKEND_API_URL = 
  import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';

// PYUSD configuration
export const PYUSD_DECIMALS = 6;
export const PYUSD_SYMBOL = 'PYUSD';
export const PYUSD_NAME = 'PayPal USD';

// Payment intervals (in seconds)
export const PAYMENT_INTERVALS = {
  DAILY: 86400,
  WEEKLY: 604800,
  MONTHLY: 2592000, // 30 days
  YEARLY: 31536000, // 365 days
} as const;

// Service provider types
export const ProviderType = {
  DirectCrypto: 0,
  AutomatedGiftCard: 1,
  ManualEntry: 2,
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
  appName: 'SubChain',
  appDescription: 'Universal Crypto Subscription Manager',
  appUrl: 'https://subchain.app',
  appIcon: 'https://subchain.app/icon.png',
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

