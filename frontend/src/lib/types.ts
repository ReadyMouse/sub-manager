import type { Address } from 'viem';

// ========================================
// API TYPES (Backend Integration)
// ========================================

/**
 * Data sent to backend API when creating a subscription via POST /api/subscriptions
 * Must match the backend's CreateSubscriptionRequest interface
 * Note: senderId is NOT sent - backend gets it from authenticated user (req.user.id)
 */
export interface CreateSubscriptionRequest {
  // Blockchain identifiers
  chainId: number;
  onChainId: string;
  
  // Sender (Payer) - wallet info only, user ID comes from auth token
  senderWalletAddress: string;
  senderCurrency: string;
  
  // Recipient (Service Provider) - recipientId can be null for wallet-only recipients
  recipientId?: string | null;
  recipientWalletAddress: string;
  recipientCurrency: string;
  
  // Service details
  serviceName: string;
  
  // Payment details
  amount: string;
  interval: number;
  nextPaymentDue: string;
  endDate?: string;
  maxPayments?: number;
  
  // Processor fee information
  processorFee?: string;
  processorFeeAddress?: string;
  processorFeeCurrency?: string;
  processorFeeID?: string;
  
  // Metadata (off-chain only)
  metadata?: {
    notes?: string;
    tags?: string[];
    serviceDescription?: string;
  };
}

/**
 * Subscription data returned from backend API
 */
export interface SubscriptionAPIResponse {
  id: string;
  chainId: number;
  onChainId: string;
  
  // Sender (Payer) - may be null for wallet-only
  sender?: {
    id: string;
    displayName: string;
    email?: string;
  } | null;
  senderWalletAddress?: string;
  senderCurrency: string;
  
  // Recipient (Service Provider) - may be null for wallet-only
  recipient?: {
    id: string;
    displayName: string;
    email?: string;
  } | null;
  recipientWalletAddress?: string;
  recipientCurrency: string;
  
  // Service details
  serviceName: string;
  serviceDescription?: string | null;
  
  // Payment details
  amount: string;
  interval: number;
  nextPaymentDue: string;
  endDate?: string | null;
  maxPayments?: number | null;
  isActive: boolean;
  paymentCount: number;
  failedPaymentCount: number;
  
  // Processor fee information
  processorFee: string;
  processorFeeAddress?: string | null;
  processorFeeCurrency: string;
  processorFeeID?: string | null;
  
  // Metadata
  notes?: string | null;
  tags?: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
}

// ========================================
// BLOCKCHAIN TYPES
// ========================================

// Subscription types
export interface Subscription {
  id: string;
  subscriber: Address;
  serviceProviderId: string;
  amount: bigint;
  interval: number;
  nextPaymentDue: number;
  isActive: boolean;
  failedPaymentCount: number;
  createdAt: number;
  endDate?: number;
  maxPayments?: number;
  paymentCount: number;
  processorFee: bigint;
  processorFeeAddress: Address;
  processorFeeCurrency: string;
  processorFeeID: string;
}

export interface ServiceProvider {
  id: string;
  walletAddress: Address;
  name: string;
  owner?: Address;
}

// Payment history
export interface Payment {
  id: string;
  subscriptionId: string;
  amount: bigint;
  processorFee: bigint;
  processorFeeAddress: Address;
  timestamp: number;
  status: PaymentStatus;
  transactionHash: string;
  reason?: string;
}

export const PaymentStatus = {
  Success: 'success',
  Failed: 'failed',
  Pending: 'pending',
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

// User data
export interface User {
  address: Address;
  subscriptionIds: string[];
  totalMonthlySpend: bigint;
  activeSubscriptionCount: number;
}

// Marketplace service
export interface MarketplaceService {
  id: string;
  name: string;
  description: string;
  logo: string;
  price: number;
  interval: number;
  category: string;
}

// Form types
export interface CreateSubscriptionForm {
  serviceProviderId: string;
  amount: string;
  interval: number;
  endDate?: number;
  maxPayments?: number;
  recipientAddress: string;
  processorFee: string;
  processorFeeAddress: string;
  processorFeeCurrency: string;
  processorFeeID: string;
}

// Balance warning
export interface BalanceWarning {
  isWarning: boolean;
  currentBalance: bigint;
  upcomingPayment: bigint;
  shortfall: bigint;
}

// Toast notification
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

// Contract interaction types
export interface ContractWriteResponse {
  hash: string;
  wait: () => Promise<void>;
}

// Envio query types
export interface EnvioSubscription {
  id: string;
  subscriber: string;
  serviceProviderId: string;
  amount: string;
  interval: string;
  nextPaymentDue: string;
  isActive: boolean;
  failedPaymentCount: string;
  createdAt: string;
  endDate?: string;
  maxPayments?: string;
  paymentCount: string;
  processorFee: string;
  processorFeeAddress: string;
  processorFeeCurrency: string;
  processorFeeID: string;
  recipientAddress?: string;
  chainId?: number;
}

export interface EnvioPayment {
  id: string;
  subscriptionId: string;
  subscriber: string;
  serviceName: string;
  amount: string;
  processorFee: string;
  processorFeeAddress: string;
  timestamp: string;
  paymentNumber: string;
  status: string;
  transactionHash?: string;
  reason?: string;
}

export interface EnvioPaymentWithDirection extends EnvioPayment {
  direction: 'sent' | 'received';
}

// Automation status
export interface AutomationStatus {
  provider: 'chainlink' | 'gelato' | null;
  isActive: boolean;
  lastExecutionTime?: number;
  upkeepBalance?: bigint;
}

// Component props types
export interface SubscriptionCardProps {
  subscription: Subscription;
  serviceName?: string;
  onCancel?: (subscriptionId: string) => void;
}

export interface ServiceCardProps {
  service: MarketplaceService;
  onSelect?: (serviceId: string) => void;
}

export interface WalletConnectProps {
  onConnect?: (address: Address) => void;
  onDisconnect?: () => void;
}

