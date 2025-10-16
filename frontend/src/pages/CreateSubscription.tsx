import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { useStableRentContract, usePYUSD, usePYUSDAllowance } from '../hooks/useContract';
import { CONTRACTS, PAYMENT_INTERVALS } from '../lib/constants';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import type { Address } from 'viem';

export const CreateSubscription: React.FC = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { createSubscription, isPending: isCreating, isSuccess: isCreateSuccess } = useStableRentContract();
  const { approve, isPending: isApproving, isSuccess: isApproveSuccess } = usePYUSD();
  const { refetch: refetchAllowance } = usePYUSDAllowance(
    address,
    CONTRACTS.StableRentSubscription as Address
  );
  const toast = useToast();

  const [isApproved, setIsApproved] = useState(false);
  const [formData, setFormData] = useState({
    serviceProviderId: '',
    amount: '',
    interval: PAYMENT_INTERVALS.MONTHLY as number,
    endDate: '',
    maxPayments: '',
    recipientAddress: '',
  });

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

  const handleApprove = async () => {
    if (!formData.amount) {
      toast.error('Error', 'Please enter an amount');
      return;
    }

    try {
      const amount = formData.amount;
      await approve(CONTRACTS.StableRentSubscription as Address, amount);
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

    // Check if recipient address is provided
    if (!formData.recipientAddress) {
      toast.error('Error', 'Please enter the recipient wallet address');
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
        'Custom Subscription', // serviceName - TODO: add to form
        endDate,
        maxPayments,
        formData.recipientAddress as Address,
        '' // recipientCurrency - empty means PYUSD
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
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-brand-navy mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to set up rent payments</p>
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
        <h1 className="text-3xl font-bold text-brand-navy mb-3">Set Up Rent Payment</h1>
        <p className="text-gray-600 text-lg">
          Configure automated monthly rent payments using PYUSD stablecoin
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Subscription Details Section */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-brand-navy mb-6">Payment Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.serviceProviderId}
                onChange={e => setFormData({ ...formData, serviceProviderId: e.target.value })}
                className="input"
                placeholder="e.g., Apartment Rent, Monthly Rent"
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

        {/* Recipient Address Section */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-brand-navy mb-6">Landlord Information</h2>
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Enter your landlord's crypto wallet address that will receive the PYUSD rent payments
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landlord Wallet Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.recipientAddress}
                onChange={e => setFormData({ ...formData, recipientAddress: e.target.value })}
                className="input"
                placeholder="0x..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                The PYUSD wallet address where rent payments will be sent
              </p>
            </div>
          </div>
        </div>

        {/* PYUSD Approval Section */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-brand-navy mb-6">PYUSD Approval</h2>
          <div className="space-y-4">
            {isApproved ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
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
                  Approve the StableRent contract to spend PYUSD tokens on your behalf for rent payments
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
        <div className="bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-teal rounded-xl p-6 text-white shadow-strong">
          <h2 className="text-xl font-bold mb-4">Payment Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="opacity-90">Description:</span>
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
            {formData.recipientAddress && (
              <div className="flex justify-between pt-2 mt-2 border-t border-white border-opacity-30">
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
              !formData.recipientAddress
            }
            className="btn-primary flex-1"
          >
            {isCreating ? 'Setting Up Payment...' : 'Set Up Rent Payment'}
          </button>
        </div>

        {/* Validation Messages */}
        {!isApproved && (
          <p className="text-sm text-gray-500 text-center">
            Please approve PYUSD before setting up the rent payment
          </p>
        )}
        {!formData.recipientAddress && isApproved && (
          <p className="text-sm text-gray-500 text-center">
            Please enter the landlord's wallet address before setting up the rent payment
          </p>
        )}
      </form>
    </div>
  );
};

