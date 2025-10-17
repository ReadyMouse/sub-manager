import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../lib/api';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/api/auth/forgot-password', { email });
      
      if (response.success) {
        setSuccess('If an account exists with that email, a password reset link has been sent.');
        setEmail('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-20rem)] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-strong p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-brand-navy mb-2 text-center">Reset Password</h1>
        <p className="text-gray-600 text-center mb-8">
          Enter your email and we'll send you a link to reset your password
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-brand-teal hover:text-brand-teal-dark text-sm">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

