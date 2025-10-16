import { Request } from 'express';

// ========================================
// EXPRESS EXTENSIONS
// ========================================

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    walletAddress?: string;
  };
}

// ========================================
// AUTH TYPES
// ========================================

export interface RegisterData {
  // Email/Password (traditional)
  email?: string;
  password?: string;
  
  // Wallet-only (privacy mode)
  walletAddress?: string;
  signature?: string;
  message?: string;
  
  // Common fields
  displayName: string;
  userType?: 'REGULAR' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface LoginData {
  // Email/Password login
  email?: string;
  password?: string;
  
  // Wallet-only login (SIWE)
  walletAddress?: string;
  signature?: string;
  message?: string;
}

export interface TokenPayload {
  userId: string;
  email?: string;           // Optional for wallet-only users
  walletAddress?: string;
  sessionId: string;
  iat?: number;             // Issued at (added by jwt.sign)
  exp?: number;             // Expires at (added by jwt.sign)
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
  refreshToken: string;
}

// ========================================
// USER TYPES
// ========================================

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  walletAddress?: string | null;
  userType: string;
  isVerified: boolean;
  emailVerified: boolean;
  createdAt: Date;
  walletConnectedAt?: Date | null;
}

export interface UpdateProfileData {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface ConnectWalletData {
  walletAddress: string;
  signature?: string; // For verification if needed
}

// ========================================
// SUBSCRIPTION TYPES
// ========================================

export interface CreateSubscriptionMetadata {
  chainId: number;
  onChainId: string;
  senderId: string;
  recipientId: string;
  serviceName: string;
  serviceDescription?: string;
  notes?: string;
  tags?: string[];
}

export interface SubscriptionResponse {
  id: string;
  chainId: number;
  onChainId: string;
  sender: {
    id: string;
    displayName: string;
    email?: string;
  };
  recipient: {
    id: string;
    displayName: string;
    email?: string;
  };
  serviceName: string;
  serviceDescription?: string | null;
  amount: string;
  interval: number;
  nextPaymentDue: Date;
  isActive: boolean;
  paymentCount: number;
  failedPaymentCount: number;
  createdAt: Date;
  tags?: string[];
}

// ========================================
// WEBHOOK TYPES (from Envio)
// ========================================

export interface EnvioWebhookPayload {
  event: string;
  data: {
    subscriptionId?: string;
    subscriber?: string;
    recipientAddress?: string;
    amount?: string;
    timestamp?: string;
    transactionHash?: string;
    [key: string]: any;
  };
}

export interface SubscriptionCreatedEvent {
  subscriptionId: string;
  senderAddress: string;
  senderId: string;
  recipientId: string;
  amount: string;
  interval: string;
  nextPaymentDue: string;
  endDate?: string;
  maxPayments?: string;
  serviceName: string;
  recipientAddress: string;
  senderCurrency: string;
  recipientCurrency: string;
  processorFee: string;
  processorFeeAddress: string;
  processorFeeCurrency: string;
  processorFeeID: string;
  timestamp: string;
}

export interface PaymentProcessedEvent {
  subscriptionId: string;
  senderAddress: string;
  senderId: string;
  recipientId: string;
  amount: string;
  processorFee: string;
  processorFeeAddress: string;
  paymentCount: string;
  timestamp: string;
  nextPaymentDue: string;
}

export interface PaymentFailedEvent {
  subscriptionId: string;
  senderAddress: string;
  senderId: string;
  recipientId: string;
  amount: string;
  timestamp: string;
  reason: string;
  failedCount: string;
}

export interface SubscriptionCancelledEvent {
  subscriptionId: string;
  senderAddress: string;
  senderId: string;
  recipientId: string;
  timestamp: string;
  reason: string;
}

// ========================================
// PAYMENT ADDRESS TYPES
// ========================================

export interface CreatePaymentAddressData {
  address: string;
  currency: string;
  label?: string;
  addressType: 'WALLET' | 'CUSTODIAL' | 'EXCHANGE';
  isDefault?: boolean;
}

// ========================================
// NOTIFICATION TYPES
// ========================================

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  subscriptionId?: string;
  paymentId?: string;
  metadata?: any;
}

// ========================================
// API RESPONSE TYPES
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ========================================
// ERROR TYPES
// ========================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

