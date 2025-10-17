import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import apiClient from '../lib/api';

interface User {
  id: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;
  emailVerified: boolean;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithWallet: (address: string, signature: string, message: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email?: string;
  password?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
      verifyAndLoadUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Verify token and load user data
  const verifyAndLoadUser = async (authToken: string) => {
    try {
      const response = await apiClient.get('/api/auth/me', { token: authToken });
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Token is invalid
        clearAuth();
      }
    } catch (error) {
      console.error('Failed to verify token:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  // Clear authentication state
  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  };

  // Login with email/password
  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      });

      if (response.success && response.data) {
        const { token: accessToken, refreshToken, user: userData } = response.data;
        setToken(accessToken);
        setUser(userData);
        localStorage.setItem(TOKEN_KEY, accessToken);
        if (refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  // Login with wallet
  const loginWithWallet = async (walletAddress: string, signature: string, message: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        walletAddress,
        signature,
        message,
      });

      if (response.success && response.data) {
        const { token: accessToken, refreshToken, user: userData } = response.data;
        setToken(accessToken);
        setUser(userData);
        localStorage.setItem(TOKEN_KEY, accessToken);
        if (refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
      } else {
        throw new Error(response.error || 'Wallet login failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Wallet login failed');
    }
  };

  // Register new user
  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.post('/api/auth/register', data);

      if (response.success && response.data) {
        // If registration returns a token (wallet-only registration), auto-login
        if (response.data.token) {
          const { token: accessToken, refreshToken, user: userData } = response.data;
          setToken(accessToken);
          setUser(userData);
          localStorage.setItem(TOKEN_KEY, accessToken);
          if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          }
        }
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (token) {
        await apiClient.post('/api/auth/logout', {}, { token });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (token) {
      await verifyAndLoadUser(token);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    loginWithWallet,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

