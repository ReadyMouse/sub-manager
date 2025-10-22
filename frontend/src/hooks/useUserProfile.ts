import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../lib/api';

export interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isVerified: boolean;
  userType: string;
  createdAt: string;
  walletAddress?: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  paymentReminders: boolean;
  paymentConfirmations: boolean;
  subscriptionUpdates: boolean;
  lowBalanceWarnings: boolean;
  marketingEmails: boolean;
  reminderDaysBefore: number;
  defaultCurrency: string;
  timezone: string;
  language: string;
}

export const useUserProfile = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [profileResponse, preferencesResponse] = await Promise.all([
        userApi.getProfile(token),
        userApi.getPreferences(token),
      ]);

      setProfile(profileResponse.data);
      setPreferences(preferencesResponse.data);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }) => {
    if (!token) return;

    try {
      const response = await userApi.updateProfile(data, token);
      setProfile(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  const updatePreferences = async (data: {
    emailNotifications?: boolean;
    paymentReminders?: boolean;
    lowBalanceWarnings?: boolean;
    marketingEmails?: boolean;
    reminderDaysBefore?: number;
    defaultCurrency?: string;
    timezone?: string;
    language?: string;
  }) => {
    if (!token) return;

    try {
      const response = await userApi.updatePreferences(data, token);
      setPreferences(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to update preferences:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  return {
    profile,
    preferences,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
    updatePreferences,
  };
};
