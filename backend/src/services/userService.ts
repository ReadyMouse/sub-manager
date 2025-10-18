import prisma from '../config/database';
import {
  UserResponse,
  UpdateProfileData,
  ConnectWalletData,
  NotFoundError,
  ValidationError,
  CreatePaymentAddressData,
} from '../types';

export class UserService {
  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Get user by wallet address
   */
  static async getUserByWallet(walletAddress: string): Promise<UserResponse | null> {
    const wallet = await prisma.connectedWallet.findFirst({
      where: { walletAddress: walletAddress.toLowerCase() },
      include: { user: true },
    });

    return wallet ? this.sanitizeUser(wallet.user) : null;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: UpdateProfileData): Promise<UserResponse> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
      },
    });

    return this.sanitizeUser(user);
  }

  /**
   * Connect wallet to user account (deprecated - use ConnectedWalletService)
   */
  static async connectWallet(userId: string, _data: ConnectWalletData): Promise<UserResponse> {
    // This is now handled by ConnectedWalletService
    // Keeping for backward compatibility
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Disconnect wallet from user account (deprecated - use ConnectedWalletService)
   */
  static async disconnectWallet(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Get user preferences
   */
  static async getPreferences(userId: string) {
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(userId: string, data: any) {
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return preferences;
  }

  /**
   * Add payment address for user
   */
  static async addPaymentAddress(userId: string, data: CreatePaymentAddressData) {
    // Validate address format based on currency
    if (data.currency === 'PYUSD' && !/^0x[a-fA-F0-9]{40}$/.test(data.address)) {
      throw new ValidationError('Invalid wallet address format for PYUSD');
    }

    // Normalize address
    const normalizedAddress = data.address.toLowerCase();

    // Check if address already exists for this user
    const existing = await prisma.paymentAddress.findFirst({
      where: {
        userId,
        address: normalizedAddress,
        currency: data.currency,
      },
    });

    if (existing) {
      throw new ValidationError('Payment address already exists');
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.paymentAddress.updateMany({
        where: {
          userId,
          currency: data.currency,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const paymentAddress = await prisma.paymentAddress.create({
      data: {
        userId,
        address: normalizedAddress,
        currency: data.currency,
        label: data.label,
        addressType: data.addressType,
        isDefault: data.isDefault || false,
        isActive: true,
      },
    });

    return paymentAddress;
  }

  /**
   * Get all payment addresses for user
   */
  static async getPaymentAddresses(userId: string) {
    return await prisma.paymentAddress.findMany({
      where: { userId, isActive: true },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get default payment address for a currency
   */
  static async getDefaultPaymentAddress(userId: string, currency: string) {
    return await prisma.paymentAddress.findFirst({
      where: {
        userId,
        currency,
        isDefault: true,
        isActive: true,
      },
    });
  }

  /**
   * Lookup recipient by email for subscription creation
   * Returns user info and their default payment address
   */
  static async lookupRecipientByEmail(email: string, currency: string = 'PYUSD') {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    // Get their default payment address for the specified currency
    const paymentAddress = await this.getDefaultPaymentAddress(user.id, currency);

    if (!paymentAddress) {
      throw new ValidationError(`User found but has no ${currency} payment address configured`);
    }

    return {
      recipientId: user.id,
      recipientAddress: paymentAddress.address,
      recipientCurrency: paymentAddress.currency,
      displayName: user.displayName,
      email: user.email,
    };
  }

  /**
   * Update payment address
   */
  static async updatePaymentAddress(userId: string, addressId: string, data: any) {
    // Verify ownership
    const address = await prisma.paymentAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundError('Payment address not found');
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.paymentAddress.updateMany({
        where: {
          userId,
          currency: address.currency,
          isDefault: true,
          id: { not: addressId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    return await prisma.paymentAddress.update({
      where: { id: addressId },
      data,
    });
  }

  /**
   * Delete payment address
   */
  static async deletePaymentAddress(userId: string, addressId: string) {
    // Verify ownership
    const address = await prisma.paymentAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundError('Payment address not found');
    }

    // Soft delete
    await prisma.paymentAddress.update({
      where: { id: addressId },
      data: { isActive: false },
    });
  }

  /**
   * Sanitize user object (remove sensitive data)
   */
  private static sanitizeUser(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email || undefined,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      walletAddress: undefined, // Use primaryWallet if needed
      userType: user.userType,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      walletConnectedAt: user.primaryWallet?.connectedAt || null,
    };
  }
}

export default UserService;

