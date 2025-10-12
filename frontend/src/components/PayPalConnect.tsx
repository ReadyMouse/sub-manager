import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePayPal } from '../hooks/usePayPal';

export const PayPalConnect: React.FC = () => {
  const { address } = useAccount();
  const { account, isLinked, isLoading, linkAccount, unlinkAccount, fetchAccount } = usePayPal(address);
  const [email, setEmail] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      fetchAccount();
    }
  }, [address, fetchAccount]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const success = await linkAccount(email);
    if (success) {
      setShowLinkForm(false);
      setEmail('');
    }
  };

  const handleUnlink = async () => {
    if (confirm('Are you sure you want to unlink your PayPal account?')) {
      await unlinkAccount();
    }
  };

  if (!address) {
    return (
      <div className="text-sm text-gray-500 px-3 py-2">
        Connect wallet first
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 px-3 py-2 animate-pulse">
        Loading PayPal...
      </div>
    );
  }

  if (isLinked && account) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-paypal-blue bg-opacity-10 px-3 py-2 rounded-lg flex items-center gap-2">
          <span className="text-2xl">💳</span>
          <div className="hidden md:block">
            <div className="text-xs text-gray-600">PayPal</div>
            <div className="text-sm font-medium text-paypal-blue-dark">
              {account.email}
            </div>
          </div>
        </div>
        <button
          onClick={handleUnlink}
          className="text-sm text-gray-600 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
          title="Unlink PayPal"
        >
          ✕
        </button>
      </div>
    );
  }

  if (showLinkForm) {
    return (
      <form onSubmit={handleLink} className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="PayPal email"
          className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-paypal-blue focus:border-transparent outline-none"
          required
        />
        <button
          type="submit"
          className="btn-primary text-sm py-2"
          disabled={isLoading}
        >
          {isLoading ? 'Linking...' : 'Link'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowLinkForm(false);
            setEmail('');
            setError(null);
          }}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowLinkForm(true)}
        className="flex items-center gap-2 bg-paypal-blue hover:bg-paypal-blue-dark text-white px-3 py-2 rounded-lg transition-colors text-sm"
      >
        <span className="text-xl">💳</span>
        <span>Link PayPal</span>
      </button>
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
};

