import { formatUnits, parseUnits } from 'viem';
import { PYUSD_DECIMALS, PAYMENT_INTERVALS } from './constants';

/**
 * Format PYUSD amount from wei to human-readable string
 */
export const formatPYUSD = (amount: bigint, decimals = 2): string => {
  const formatted = formatUnits(amount, PYUSD_DECIMALS);
  return Number(formatted).toFixed(decimals);
};

/**
 * Parse PYUSD amount from string to wei
 */
export const parsePYUSD = (amount: string): bigint => {
  return parseUnits(amount, PYUSD_DECIMALS);
};

/**
 * Format address to short form (0x1234...5678)
 */
export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Format timestamp to human-readable date
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format timestamp to human-readable date and time
 */
export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get interval label (Daily, Weekly, Monthly, Yearly)
 */
export const getIntervalLabel = (intervalSeconds: number): string => {
  if (intervalSeconds === PAYMENT_INTERVALS.DAILY) return 'Daily';
  if (intervalSeconds === PAYMENT_INTERVALS.WEEKLY) return 'Weekly';
  if (intervalSeconds === PAYMENT_INTERVALS.MONTHLY) return 'Monthly';
  if (intervalSeconds === PAYMENT_INTERVALS.YEARLY) return 'Yearly';
  return `Every ${intervalSeconds / 86400} days`;
};

/**
 * Calculate time until next payment
 */
export const getTimeUntilPayment = (nextPaymentDue: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const diff = nextPaymentDue - now;
  
  if (diff <= 0) return 'Overdue';
  
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

/**
 * Check if payment is due soon (within 24 hours)
 */
export const isPaymentDueSoon = (nextPaymentDue: number): boolean => {
  const now = Math.floor(Date.now() / 1000);
  const diff = nextPaymentDue - now;
  return diff > 0 && diff <= 86400;
};

/**
 * Check if payment is overdue
 */
export const isPaymentOverdue = (nextPaymentDue: number): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return nextPaymentDue < now;
};

/**
 * Format USD amount
 */
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Open Etherscan link
 */
export const getEtherscanLink = (
  hash: string,
  type: 'tx' | 'address' = 'tx',
  chainId = 1
): string => {
  const baseUrl = chainId === 1 
    ? 'https://etherscan.io' 
    : 'https://sepolia.etherscan.io';
  return `${baseUrl}/${type}/${hash}`;
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Calculate monthly spending from subscriptions
 */
export const calculateMonthlySpend = (subscriptions: Array<{ amount: bigint; interval: number; isActive: boolean }>): bigint => {
  return subscriptions
    .filter(sub => sub.isActive)
    .reduce((total, sub) => {
      const monthlyAmount = (sub.amount * BigInt(PAYMENT_INTERVALS.MONTHLY)) / BigInt(sub.interval);
      return total + monthlyAmount;
    }, 0n);
};

/**
 * Format large numbers with K, M suffixes
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

/**
 * Sleep utility for delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

