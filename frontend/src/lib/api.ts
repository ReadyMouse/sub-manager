// API client for backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiOptions extends RequestInit {
  token?: string;
}

/**
 * Get the auth token from localStorage
 * This allows the API client to work without requiring the React context
 */
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

/**
 * API client with automatic token handling
 */
export const apiClient = {
  async request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add authorization header if token is provided, or try to get from localStorage
    const authToken = token || getStoredToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  get<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = any>(endpoint: string, data?: any, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put<T = any>(endpoint: string, data?: any, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

/**
 * Payment Address API endpoints
 */
/**
 * User Profile API endpoints
 */
export const userApi = {
  async getProfile(token?: string) {
    return apiClient.get('/api/users/me', { token });
  },

  async updateProfile(data: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }, token?: string) {
    return apiClient.put('/api/users/me', data, { token });
  },

  async getPreferences(token?: string) {
    return apiClient.get('/api/users/me/preferences', { token });
  },

  async updatePreferences(data: {
    emailNotifications?: boolean;
    paymentReminders?: boolean;
    lowBalanceWarnings?: boolean;
    marketingEmails?: boolean;
    reminderDaysBefore?: number;
    defaultCurrency?: string;
    timezone?: string;
    language?: string;
  }, token?: string) {
    return apiClient.put('/api/users/me/preferences', data, { token });
  },
};

/**
 * Subscription API endpoints
 */
export const subscriptionApi = {
  async getAll(token?: string) {
    return apiClient.get('/api/subscriptions', { token });
  },

  async getSent(token?: string) {
    return apiClient.get('/api/subscriptions/sent', { token });
  },

  async getReceived(token?: string) {
    return apiClient.get('/api/subscriptions/received', { token });
  },
};

/**
 * Payment API endpoints
 */
export const paymentApi = {
  async getAll(token?: string) {
    return apiClient.get('/api/payments', { token });
  },

  async getBySubscription(subscriptionId: string, token?: string) {
    return apiClient.get(`/api/payments/subscription/${subscriptionId}`, { token });
  },
};

export const paymentAddressApi = {
  async getAll(token?: string) {
    return apiClient.get('/api/users/me/payment-addresses', { token });
  },

  async create(data: {
    address: string;
    currency: string;
    label?: string;
    addressType: 'WALLET' | 'CUSTODIAL' | 'EXCHANGE';
    isDefault?: boolean;
  }, token?: string) {
    return apiClient.post('/api/users/me/payment-addresses', data, { token });
  },

  async update(id: string, data: {
    label?: string;
    isDefault?: boolean;
    isActive?: boolean;
  }, token?: string) {
    return apiClient.put(`/api/users/me/payment-addresses/${id}`, data, { token });
  },

  async delete(id: string, token?: string) {
    return apiClient.delete(`/api/users/me/payment-addresses/${id}`, { token });
  },
};

export default apiClient;

