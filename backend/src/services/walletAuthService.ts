import { verifyMessage } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { env } from '../config/env';
import {
  AuthResponse,
  TokenPayload,
  UserResponse,
  UnauthorizedError,
  ValidationError,
} from '../types';
import jwt from 'jsonwebtoken';

/**
 * Wallet-only authentication service
 * For privacy-focused users who don't want to provide email/password
 */
export class WalletAuthService {
  /**
   * Register with wallet only (no email/password)
   */
  static async registerWithWallet(
    walletAddress: string,
    signature: string,
    message: string,
    displayName?: string,
    firstName?: string,
    lastName?: string,
    phoneNumber?: string
  ): Promise<AuthResponse> {
    // Normalize wallet address
    const normalizedAddress = walletAddress.toLowerCase();

    // Verify signature
    const isValid = await this.verifySignature(normalizedAddress, message, signature);
    if (!isValid) {
      throw new ValidationError('Invalid signature - wallet verification failed');
    }

    // Check if wallet already registered
    const existingWallet = await prisma.connectedWallet.findFirst({
      where: { walletAddress: normalizedAddress },
      include: { user: true },
    });

    if (existingWallet) {
      throw new ValidationError('This wallet is already registered');
    }

    // Create user (no email/password)
    const user = await prisma.user.create({
      data: {
        email: null,
        passwordHash: null,
        displayName: displayName || `Wallet User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        firstName,
        lastName,
        phoneNumber,
        userType: 'REGULAR',
        emailVerified: false,
        verificationLevel: 'WALLET',
        isVerified: true, // Wallet signature = verified
        isActive: true,
      },
    });

    // Create connected wallet
    const wallet = await prisma.connectedWallet.create({
      data: {
        userId: user.id,
        walletAddress: normalizedAddress,
        label: 'Primary Wallet',
        isVerified: true,
        verificationSignature: signature,
        verificationMessage: message,
        verifiedAt: new Date(),
        isPrimary: true,
        isActive: true,
      },
    });

    // Set as primary wallet
    await prisma.user.update({
      where: { id: user.id },
      data: { primaryWalletId: wallet.id },
    });

    // Create default preferences
    await prisma.userPreferences.create({
      data: { userId: user.id },
    });

    // Create session
    const session = await this.createSession(user.id, normalizedAddress);

    return {
      user: this.sanitizeUser(user, normalizedAddress),
      token: session.token,
      refreshToken: session.refreshToken!,
    };
  }

  /**
   * Login with wallet only (SIWE)
   */
  static async loginWithWallet(
    walletAddress: string,
    signature: string,
    message: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    // Normalize wallet address
    const normalizedAddress = walletAddress.toLowerCase();

    // Verify signature
    const isValid = await this.verifySignature(normalizedAddress, message, signature);
    if (!isValid) {
      throw new UnauthorizedError('Invalid signature');
    }

    // Find wallet
    const wallet = await prisma.connectedWallet.findFirst({
      where: {
        walletAddress: normalizedAddress,
        isActive: true,
      },
      include: { user: true },
    });

    if (!wallet) {
      throw new UnauthorizedError('Wallet not registered. Please sign up first.');
    }

    // Check if account is active
    if (!wallet.user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    if (wallet.user.isSuspended) {
      throw new UnauthorizedError(
        `Account is suspended: ${wallet.user.suspensionReason || 'Contact support'}`
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: wallet.user.id },
      data: { lastLoginAt: new Date() },
    });

    // Update wallet last used
    await prisma.connectedWallet.update({
      where: { id: wallet.id },
      data: { lastUsedAt: new Date() },
    });

    // Create session
    const session = await this.createSession(
      wallet.user.id,
      normalizedAddress,
      ipAddress,
      userAgent
    );

    return {
      user: this.sanitizeUser(wallet.user, normalizedAddress),
      token: session.token,
      refreshToken: session.refreshToken!,
    };
  }

  /**
   * Generate SIWE message for wallet to sign
   */
  static generateSIWEMessage(walletAddress: string, nonce: string): string {
    const domain = env.API_URL.replace(/^https?:\/\//, '');
    const issuedAt = new Date().toISOString();

    return `${domain} wants you to sign in with your Ethereum account:
${walletAddress}

Sign this message to prove you own this wallet and sign in to StableRent.

URI: ${env.API_URL}
Version: 1
Nonce: ${nonce}
Issued At: ${issuedAt}`;
  }

  /**
   * Verify SIWE signature
   */
  private static async verifySignature(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    try {
      // Recover signer address from signature
      const recoveredAddress = verifyMessage(message, signature);

      // Compare with claimed address (case-insensitive)
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Create a new session and generate JWT tokens
   */
  private static async createSession(
    userId: string,
    walletAddress: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ token: string; refreshToken: string }> {
    const sessionId = uuidv4();

    const payload: TokenPayload = {
      userId,
      email: undefined, // Wallet-only users don't have email
      walletAddress,
      sessionId,
    };

    // Generate JWT token
    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    // Generate refresh token
    const refreshToken = jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);

    // Calculate expiry
    const expiresAt = new Date(Date.now() + this.parseExpiry(env.JWT_EXPIRES_IN));

    // Create session in database
    await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        token,
        refreshToken,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    return { token, refreshToken };
  }

  /**
   * Parse expiry string (e.g., "7d", "24h") to milliseconds
   */
  private static parseExpiry(expiry: string): number {
    const value = parseInt(expiry);
    const unit = expiry.slice(-1);

    const multipliers: { [key: string]: number } = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] || multipliers.d);
  }

  /**
   * Sanitize user object (remove sensitive data)
   */
  private static sanitizeUser(user: any, walletAddress: string): UserResponse {
    return {
      id: user.id,
      email: user.email || undefined,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      walletAddress,
      userType: user.userType,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      walletConnectedAt: user.primaryWallet?.connectedAt,
    };
  }
}

export default WalletAuthService;

