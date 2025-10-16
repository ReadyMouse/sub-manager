import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { env } from '../config/env';
import {
  RegisterData,
  LoginData,
  AuthResponse,
  TokenPayload,
  UserResponse,
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} from '../types';

const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * Register a new user with email/password
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, displayName, userType, firstName, lastName, phoneNumber } = data;

    // Email/password are required for traditional registration
    if (!email || !password) {
      throw new ValidationError('Email and password are required for email/password registration');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate email verification token
    const emailVerificationToken = uuidv4();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName,
        userType: userType || 'REGULAR',
        firstName,
        lastName,
        phoneNumber,
        emailVerificationToken,
        emailVerified: false,
        verificationLevel: 'BASIC',
        isActive: true,
      },
    });

    // Create default preferences
    await prisma.userPreferences.create({
      data: {
        userId: user.id,
      },
    });

    // Create session and generate tokens
    const session = await this.createSession(user.id, user.email!);

    // TODO: Send verification email
    // await EmailService.sendVerificationEmail(user.email, emailVerificationToken);

    return {
      user: this.sanitizeUser(user),
      token: session.token,
      refreshToken: session.refreshToken!,
    };
  }

  /**
   * Login user with email/password
   */
  static async login(data: LoginData, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password } = data;

    // Email/password are required for email/password login
    if (!email || !password) {
      throw new UnauthorizedError('Email and password are required');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    if (user.isSuspended) {
      throw new UnauthorizedError(`Account is suspended: ${user.suspensionReason || 'Contact support'}`);
    }

    // Check if user has password (not wallet-only)
    if (!user.passwordHash) {
      throw new UnauthorizedError('This account uses wallet authentication. Please sign in with your wallet.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session and generate tokens
    const session = await this.createSession(user.id, user.email!, undefined, ipAddress, userAgent);

    return {
      user: this.sanitizeUser(user),
      token: session.token,
      refreshToken: session.refreshToken!,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as TokenPayload;

      // Find session
      const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session || session.userId !== payload.userId) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Check if session expired
      if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: session.id } });
        throw new UnauthorizedError('Session expired');
      }

      // Create new session
      const newSession = await this.createSession(
        session.user.id,
        session.user.email || undefined,
        undefined
      );

      // Delete old session
      await prisma.session.delete({ where: { id: session.id } });

      return {
        token: newSession.token,
        refreshToken: newSession.refreshToken!,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Logout user (invalidate session)
   */
  static async logout(token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  /**
   * Verify JWT token and return user
   */
  static async verifyToken(token: string): Promise<UserResponse> {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

      // Find session
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || session.userId !== payload.userId) {
        throw new UnauthorizedError('Invalid token');
      }

      // Check if session expired
      if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: session.id } });
        throw new UnauthorizedError('Session expired');
      }

      // Update last used
      await prisma.session.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      });

      return this.sanitizeUser(session.user);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Verify email with verification token
   */
  static async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new NotFoundError('Invalid verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        verificationLevel: 'BASIC',
      },
    });
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetExpiry,
      },
    });

    // TODO: Send password reset email
    // await EmailService.sendPasswordResetEmail(user.email, resetToken);
  }

  /**
   * Reset password with reset token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Validate password strength
    if (newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });
  }

  /**
   * Create a new session and generate JWT tokens
   */
  private static async createSession(
    userId: string,
    email?: string,
    walletAddress?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ token: string; refreshToken: string }> {
    const sessionId = uuidv4();

    const payload: TokenPayload = {
      userId,
      email,
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
  private static sanitizeUser(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email || undefined,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      walletAddress: undefined, // Will be populated from primaryWallet if needed
      userType: user.userType,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      walletConnectedAt: user.primaryWallet?.connectedAt || null,
    };
  }
}

export default AuthService;

