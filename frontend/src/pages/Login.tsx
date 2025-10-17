import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAccount, useSignMessage } from 'wagmi';
import apiClient from '../lib/api';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithWallet } = useAuth();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [loginMethod, setLoginMethod] = useState<'email' | 'wallet'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get the redirect path from location state, or default to home
  const from = (location.state as any)?.from?.pathname || '/';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setError('');
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

      // Login with wallet
      await loginWithWallet(address, signature, message);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Wallet login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-20rem)] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-strong p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-brand-navy mb-2 text-center">Welcome Back</h1>
        <p className="text-gray-600 text-center mb-8">Sign in to your StableRent account</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Login Method Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              loginMethod === 'email'
                ? 'bg-brand-teal text-white shadow-soft'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Email & Password
          </button>
          <button
            onClick={() => setLoginMethod('wallet')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              loginMethod === 'wallet'
                ? 'bg-brand-teal text-white shadow-soft'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Sign In with Wallet
          </button>
        </div>

        {/* Email/Password Login Form */}
        {loginMethod === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
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
                Password
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
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-brand-teal hover:text-brand-teal-dark">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Wallet Login */}
        {loginMethod === 'wallet' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">Sign in with your Web3 wallet</p>
              <p className="text-blue-700">
                {isConnected
                  ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}`
                  : 'Please connect your wallet first using the button in the header.'}
              </p>
            </div>

            <button
              onClick={handleWalletLogin}
              disabled={isLoading || !isConnected}
              className="btn-primary w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign In with Wallet'}
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

        {/* Register Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-teal hover:text-brand-teal-dark font-medium">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

