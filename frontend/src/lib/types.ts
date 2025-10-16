import type { Address } from 'viem';

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
}

export interface EnvioPayment {
  id: string;
  subscriptionId: string;
  amount: string;
  processorFee: string;
  processorFeeAddress: string;
  timestamp: string;
  status: string;
  transactionHash: string;
  reason?: string;
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

