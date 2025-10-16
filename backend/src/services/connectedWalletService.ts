import prisma from '../config/database';
import { NotFoundError, ValidationError } from '../types';

export interface ConnectWalletData {
  walletAddress: string;
  signature: string;
  message: string;
  label?: string;
}

export class ConnectedWalletService {
  /**
   * Connect and verify a wallet using signature
   */
  static async connectWallet(userId: string, data: ConnectWalletData) {
    const { walletAddress, signature, message, label } = data;

    // Normalize wallet address
    const normalizedAddress = walletAddress.toLowerCase();

    // Verify signature
    const isValid = await this.verifySignature(normalizedAddress, message, signature);
    if (!isValid) {
      throw new ValidationError('Invalid signature - wallet verification failed');
    }

    // Check if wallet already connected to this user
    const existing = await prisma.connectedWallet.findFirst({
      where: {
        userId,
        walletAddress: normalizedAddress,
      },
    });

    if (existing) {
      // Update verification
      return await prisma.connectedWallet.update({
        where: { id: existing.id },
        data: {
          isVerified: true,
          verificationSignature: signature,
          verificationMessage: message,
          verifiedAt: new Date(),
          isActive: true,
        },
      });
    }

    // Check if wallet connected to another user
    const connectedElsewhere = await prisma.connectedWallet.findFirst({
      where: {
        walletAddress: normalizedAddress,
        userId: { not: userId },
      },
    });

    if (connectedElsewhere) {
      throw new ValidationError('This wallet is already connected to another account');
    }

    // Check if this is the first wallet (make it primary)
    const walletCount = await prisma.connectedWallet.count({
      where: { userId, isActive: true },
    });

    const isPrimary = walletCount === 0;

    // Create new connected wallet
    return await prisma.connectedWallet.create({
      data: {
        userId,
        walletAddress: normalizedAddress,
        label: label || 'My Wallet',
        isVerified: true,
        verificationSignature: signature,
        verificationMessage: message,
        verifiedAt: new Date(),
        isPrimary,
        isActive: true,
      },
    });
  }

  /**
   * Get all connected wallets for a user
   */
  static async getConnectedWallets(userId: string) {
    return await prisma.connectedWallet.findMany({
      where: { userId, isActive: true },
      orderBy: [
        { isPrimary: 'desc' },
        { connectedAt: 'desc' },
      ],
    });
  }

  /**
   * Get primary wallet for user
   */
  static async getPrimaryWallet(userId: string) {
    return await prisma.connectedWallet.findFirst({
      where: {
        userId,
        isPrimary: true,
        isActive: true,
      },
    });
  }

  /**
   * Set wallet as primary
   */
  static async setPrimaryWallet(userId: string, walletId: string) {
    // Verify ownership
    const wallet = await prisma.connectedWallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    // Unset other primary wallets
    await prisma.connectedWallet.updateMany({
      where: {
        userId,
        isPrimary: true,
        id: { not: walletId },
      },
      data: { isPrimary: false },
    });

    // Set as primary
    return await prisma.connectedWallet.update({
      where: { id: walletId },
      data: { isPrimary: true },
    });
  }

  /**
   * Update wallet label
   */
  static async updateWalletLabel(userId: string, walletId: string, label: string) {
    const wallet = await prisma.connectedWallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    return await prisma.connectedWallet.update({
      where: { id: walletId },
      data: { label },
    });
  }

  /**
   * Disconnect wallet (soft delete)
   */
  static async disconnectWallet(userId: string, walletId: string) {
    const wallet = await prisma.connectedWallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    // Can't disconnect primary if there are other wallets
    if (wallet.isPrimary) {
      const otherWallets = await prisma.connectedWallet.count({
        where: {
          userId,
          isActive: true,
          id: { not: walletId },
        },
      });

      if (otherWallets > 0) {
        throw new ValidationError(
          'Cannot disconnect primary wallet. Set another wallet as primary first.'
        );
      }
    }

    // Soft delete
    return await prisma.connectedWallet.update({
      where: { id: walletId },
      data: { isActive: false },
    });
  }

  /**
   * Verify SIWE (Sign-In With Ethereum) signature
   */
  private static async verifySignature(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    try {
      // Import ethers for signature verification
      const { verifyMessage } = await import('ethers');

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
   * Generate SIWE message for wallet to sign
   */
  static generateSIWEMessage(walletAddress: string, nonce: string): string {
    const domain = process.env.FRONTEND_URL || 'localhost:5173';
    const issuedAt = new Date().toISOString();

    return `${domain} wants you to sign in with your Ethereum account:
${walletAddress}

By signing, you prove ownership of this wallet and can use it to send payments.

URI: ${domain}
Version: 1
Nonce: ${nonce}
Issued At: ${issuedAt}`;
  }
}

export default ConnectedWalletService;

