import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { useSubChainContract, usePYUSD, usePYUSDAllowance } from '../hooks/useContract';
import { usePayPal } from '../hooks/usePayPal';
import { CONTRACTS, PAYMENT_INTERVALS } from '../lib/constants';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import type { Address } from 'viem';

export const CreateSubscription: React.FC = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { createSubscription, isPending: isCreating, isSuccess: isCreateSuccess } = useSubChainContract();
  const { approve, isPending: isApproving, isSuccess: isApproveSuccess } = usePYUSD();
  const { refetch: refetchAllowance } = usePYUSDAllowance(
    address,
    CONTRACTS.SubChainSubscription as Address
  );
  const { account, isLinked, linkAccount, isPending: isLinkingPayPal } = usePayPal(address);
  const toast = useToast();

  const [isApproved, setIsApproved] = useState(false);
  const [paymentType, setPaymentType] = useState<'paypal' | 'crypto'>('paypal');
  const [formData, setFormData] = useState({
    serviceProviderId: '',
    amount: '',
    interval: PAYMENT_INTERVALS.MONTHLY,
    endDate: '',
    maxPayments: '',
    paypalEmail: '',
    recipientAddress: '',
  });

  // Check if PayPal is already linked
  useEffect(() => {
    if (isLinked && account?.email) {
      setFormData(prev => ({ ...prev, paypalEmail: account.email || '' }));
    }
  }, [isLinked, account]);

  // Handle approve success
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success('Success', 'PYUSD allowance approved');
      refetchAllowance();
      setIsApproved(true);
    }
  }, [isApproveSuccess, toast, refetchAllowance]);

  // Handle create success
  useEffect(() => {
    if (isCreateSuccess) {
      toast.success('Success', 'Subscription created successfully!');
      setTimeout(() => {
        navigate('/subscriptions');
      }, 2000);
    }
  }, [isCreateSuccess, navigate, toast]);

  const handleLinkPayPal = async () => {
    if (!formData.paypalEmail) {
      toast.error('Error', 'Please enter your PayPal email');
      return;
    }

    const success = await linkAccount(formData.paypalEmail);
    if (success) {
      toast.success('Success', 'PayPal account linked');
    } else {
      toast.error('Error', 'Failed to link PayPal account');
    }
  };

  const handleApprove = async () => {
    if (!formData.amount) {
      toast.error('Error', 'Please enter an amount');
      return;
    }

    try {
      const amount = formData.amount;
      await approve(CONTRACTS.SubChainSubscription as Address, amount);
    } catch (error) {
      console.error('Approve failed:', error);
      toast.error('Error', 'Failed to approve PYUSD');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.serviceProviderId || !formData.amount || !formData.interval) {
      toast.error('Error', 'Please fill in all required fields');
      return;
    }

    // Check if PayPal is linked (only for PayPal payment type)
    if (paymentType === 'paypal' && !isLinked) {
      toast.error('Error', 'Please link your PayPal account first');
      return;
    }

    // Check if recipient address is provided (only for crypto payment type)
    if (paymentType === 'crypto' && !formData.recipientAddress) {
      toast.error('Error', 'Please enter the recipient crypto address');
      return;
    }

    // Check if PYUSD is approved
    if (!isApproved) {
      toast.error('Error', 'Please approve PYUSD allowance first');
      return;
    }

    try {
      const endDate = formData.endDate ? Math.floor(new Date(formData.endDate).getTime() / 1000) : 0;
      const maxPayments = formData.maxPayments ? parseInt(formData.maxPayments) : 0;

      await createSubscription(
        formData.serviceProviderId,
        formData.amount,
        formData.interval,
        endDate,
        maxPayments
      );
    } catch (error) {
      console.error('Create subscription failed:', error);
      toast.error('Error', 'Failed to create subscription');
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to create a subscription</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Subscription</h1>
        <p className="text-gray-600">
          Set up automatic crypto payments for any service
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Subscription Details Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.serviceProviderId}
                onChange={e => setFormData({ ...formData, serviceProviderId: e.target.value })}
                className="input"
                placeholder="e.g., Netflix Premium, Spotify Family, GitHub Pro"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (PYUSD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="input"
                  placeholder="15.49"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Interval <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.interval}
                  onChange={e => setFormData({ ...formData, interval: parseInt(e.target.value) })}
                  className="input"
                  required
                >
                  <option value={PAYMENT_INTERVALS.DAILY}>Daily</option>
                  <option value={PAYMENT_INTERVALS.WEEKLY}>Weekly</option>
                  <option value={PAYMENT_INTERVALS.MONTHLY}>Monthly</option>
                  <option value={PAYMENT_INTERVALS.YEARLY}>Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for indefinite subscription
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Payments (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxPayments}
                  onChange={e => setFormData({ ...formData, maxPayments: e.target.value })}
                  className="input"
                  placeholder="e.g., 12"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of payments before auto-cancel
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
          <div className="space-y-4">
            <p className="text-gray-600 text-sm mb-4">
              Choose how you want to make subscription payments
            </p>
            
            {/* Payment Type Toggle */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentType('paypal')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentType === 'paypal'
                    ? 'border-paypal-blue bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-3xl">💳</span>
                  {paymentType === 'paypal' && <span className="text-xl">✓</span>}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Via PayPal</h3>
                <p className="text-xs text-gray-600">
                  Auto-convert PYUSD to fiat and pay via PayPal
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('crypto')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentType === 'crypto'
                    ? 'border-pyusd-green bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-3xl">🪙</span>
                  {paymentType === 'crypto' && <span className="text-xl">✓</span>}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Crypto Direct</h3>
                <p className="text-xs text-gray-600">
                  Pay directly with PYUSD to a crypto address
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* PayPal Integration Section */}
        {paymentType === 'paypal' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">PayPal Integration</h2>
          <div className="space-y-4">
            {isLinked ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                  <p className="font-semibold text-green-900">PayPal Account Linked</p>
                  <p className="text-sm text-green-700">{account?.email}</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-sm">
                  Link your PayPal account to receive automatic subscription payments converted from PYUSD
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PayPal Email <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={formData.paypalEmail}
                      onChange={e => setFormData({ ...formData, paypalEmail: e.target.value })}
                      className="input flex-1"
                      placeholder="your@email.com"
                      disabled={isLinkingPayPal}
                    />
                    <button
                      type="button"
                      onClick={handleLinkPayPal}
                      disabled={isLinkingPayPal || !formData.paypalEmail}
                      className="btn-primary whitespace-nowrap"
                    >
                      {isLinkingPayPal ? 'Linking...' : 'Link PayPal'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        )}

        {/* Crypto Direct Section */}
        {paymentType === 'crypto' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recipient Address</h2>
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Enter the crypto wallet address that will receive the PYUSD payments
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Wallet Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.recipientAddress}
                  onChange={e => setFormData({ ...formData, recipientAddress: e.target.value })}
                  className="input"
                  placeholder="0x..."
                  required={paymentType === 'crypto'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The wallet address of the service provider or recipient
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PYUSD Approval Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">PYUSD Approval</h2>
          <div className="space-y-4">
            {isApproved ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                  <p className="font-semibold text-green-900">PYUSD Approved</p>
                  <p className="text-sm text-green-700">
                    The contract can now spend {formData.amount} PYUSD on your behalf
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-sm">
                  Approve the SubChain contract to spend PYUSD tokens on your behalf for subscription payments
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-blue-900">Amount to Approve:</span>
                    <span className="font-bold text-blue-900">
                      {formData.amount || '0'} PYUSD
                    </span>
                  </div>
                  <p className="text-xs text-blue-700">
                    This is a one-time approval for the subscription amount
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving || !formData.amount}
                  className="btn-primary w-full"
                >
                  {isApproving ? 'Approving...' : 'Approve PYUSD'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-gradient-to-br from-paypal-blue to-blue-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Subscription Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="opacity-90">Subscription:</span>
              <span className="font-semibold">{formData.serviceProviderId || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-90">Amount:</span>
              <span className="font-semibold">{formData.amount || '0'} PYUSD</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-90">Processing Fee (5%):</span>
              <span className="font-semibold">
                {formData.amount ? (parseFloat(formData.amount) * 0.05).toFixed(2) : '0.00'} PYUSD
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white border-opacity-30 text-lg">
              <span className="font-bold">Total per Payment:</span>
              <span className="font-bold">
                {formData.amount ? (parseFloat(formData.amount) * 1.05).toFixed(2) : '0.00'} PYUSD
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-90">Frequency:</span>
              <span className="font-semibold">
                {formData.interval === PAYMENT_INTERVALS.DAILY && 'Daily'}
                {formData.interval === PAYMENT_INTERVALS.WEEKLY && 'Weekly'}
                {formData.interval === PAYMENT_INTERVALS.MONTHLY && 'Monthly'}
                {formData.interval === PAYMENT_INTERVALS.YEARLY && 'Yearly'}
              </span>
            </div>
            {formData.endDate && (
              <div className="flex justify-between">
                <span className="opacity-90">End Date:</span>
                <span className="font-semibold">{formData.endDate}</span>
              </div>
            )}
            {formData.maxPayments && (
              <div className="flex justify-between">
                <span className="opacity-90">Max Payments:</span>
                <span className="font-semibold">{formData.maxPayments}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 mt-2 border-t border-white border-opacity-30">
              <span className="opacity-90">Payment Method:</span>
              <span className="font-semibold">
                {paymentType === 'paypal' ? '💳 PayPal' : '🪙 Crypto Direct'}
              </span>
            </div>
            {paymentType === 'paypal' && (
              <div className="flex justify-between">
                <span className="opacity-90">PayPal Email:</span>
                <span className="font-semibold">{formData.paypalEmail || account?.email || '—'}</span>
              </div>
            )}
            {paymentType === 'crypto' && formData.recipientAddress && (
              <div className="flex justify-between">
                <span className="opacity-90">Recipient:</span>
                <span className="font-semibold text-xs break-all">
                  {formData.recipientAddress.slice(0, 6)}...{formData.recipientAddress.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              isCreating || 
              !isApproved || 
              (paymentType === 'paypal' && !isLinked) ||
              (paymentType === 'crypto' && !formData.recipientAddress)
            }
            className="btn-primary flex-1"
          >
            {isCreating ? 'Creating Subscription...' : 'Create Subscription'}
          </button>
        </div>

        {/* Validation Messages */}
        {!isApproved && (
          <p className="text-sm text-gray-500 text-center">
            Please approve PYUSD before creating the subscription
          </p>
        )}
        {paymentType === 'paypal' && !isLinked && isApproved && (
          <p className="text-sm text-gray-500 text-center">
            Please link your PayPal account before creating the subscription
          </p>
        )}
        {paymentType === 'crypto' && !formData.recipientAddress && isApproved && (
          <p className="text-sm text-gray-500 text-center">
            Please enter the recipient wallet address before creating the subscription
          </p>
        )}
      </form>
    </div>
  );
};

