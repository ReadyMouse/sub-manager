import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAccount, useSignMessage } from 'wagmi';
import apiClient from '../lib/api';

export const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithWallet } = useAuth();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [registerMethod, setRegisterMethod] = useState<'email' | 'wallet'>('email');
  
  // Email registration fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Common fields
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      await register({
        email,
        password,
        displayName: displayName || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber: phoneNumber || undefined,
      });

      setSuccess('Registration successful! Please check your email to verify your account.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      
      // Check if email is already registered
      if (errorMessage.includes('already registered')) {
        setError('This email is already registered. Please use the login page to sign in.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletRegister = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!isConnected || !address) {
        throw new Error('Please connect your wallet first');
      }

      // Generate message from backend
      const messageResponse = await apiClient.post('/api/auth/wallet/generate-message', {
        walletAddress: address,
      });

      if (!messageResponse.success) {
        throw new Error('Failed to generate signature message');
      }

      const { message } = messageResponse.data;

      // Sign the message
      const signature = await signMessageAsync({ message });

      // Register with wallet - this will auto-login
      const registerResponse = await apiClient.post('/api/auth/register', {
        walletAddress: address,
        signature,
        message,
        displayName: displayName || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber: phoneNumber || undefined,
      });

      if (registerResponse.success) {
        // Use loginWithWallet to set the auth state
        await loginWithWallet(address, signature, message);
        navigate('/');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Wallet registration failed';
      
      // Check if wallet is already registered
      if (errorMessage.includes('already registered')) {
        setError('This wallet is already registered. Please use the login page to sign in with your wallet.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-20rem)] flex items-center justify-center py-8">
      <div className="bg-white rounded-2xl shadow-strong p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-brand-navy mb-2 text-center">Create Account</h1>
        <p className="text-gray-600 text-center mb-8">Join StableRent today</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            {error.includes('already registered') && (
              <div className="mt-2">
                <Link to="/login" className="text-brand-teal hover:text-brand-teal-dark font-medium underline">
                  Go to Login Page →
                </Link>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Registration Method Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setRegisterMethod('email')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              registerMethod === 'email'
                ? 'bg-brand-teal text-white shadow-soft'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Email & Password
          </button>
          <button
            onClick={() => setRegisterMethod('wallet')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              registerMethod === 'wallet'
                ? 'bg-brand-teal text-white shadow-soft'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Wallet Only
          </button>
        </div>

        {/* Email/Password Registration Form */}
        {registerMethod === 'email' && (
          <form onSubmit={handleEmailRegister} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
                placeholder="John Doe"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="John"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  placeholder="Doe"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Wallet Registration */}
        {registerMethod === 'wallet' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">Register with your Web3 wallet</p>
              <p className="text-blue-700">
                {isConnected
                  ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}`
                  : 'Please connect your wallet first using the button in the header.'}
              </p>
            </div>

            <div>
              <label htmlFor="displayNameWallet" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="displayNameWallet"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
                placeholder="John Doe"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstNameWallet" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstNameWallet"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="John"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="lastNameWallet" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastNameWallet"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  placeholder="Doe"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              onClick={handleWalletRegister}
              disabled={isLoading || !isConnected}
              className="btn-primary w-full"
            >
              {isLoading ? 'Creating account...' : 'Register with Wallet'}
            </button>

            {!isConnected && (
              <p className="text-sm text-gray-600 text-center">
                Use the "Connect MetaMask" button in the header to connect your wallet first.
              </p>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-teal hover:text-brand-teal-dark font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

