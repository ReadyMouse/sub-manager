import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import type { MarketplaceService } from '../lib/types';
import { useSubChainContract, usePYUSD, usePYUSDAllowance } from '../hooks/useContract';
import { usePayPal } from '../hooks/usePayPal';
import { CONTRACTS, PAYMENT_INTERVALS } from '../lib/constants';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import type { Address } from 'viem';

interface CreateSubscriptionProps {
  service: MarketplaceService | null;
  onClose: () => void;
}

export const CreateSubscription: React.FC<CreateSubscriptionProps> = ({ service, onClose }) => {
  const { address, isConnected } = useAccount();
  const { createSubscription, isPending: isCreating, isSuccess: isCreateSuccess } = useSubChainContract();
  const { approve, isPending: isApproving, isSuccess: isApproveSuccess } = usePYUSD();
  const { refetch: refetchAllowance } = usePYUSDAllowance(
    address,
    CONTRACTS.SubChainSubscription as Address
  );
  const { account, isLinked, linkAccount } = usePayPal(address);
  const toast = useToast();

  const [step, setStep] = useState<'details' | 'paypal' | 'approve' | 'create' | 'success'>('details');
  const [formData, setFormData] = useState({
    serviceProviderId: service?.id || '',
    amount: service?.price.toString() || '',
    interval: service?.interval || PAYMENT_INTERVALS.MONTHLY,
    endDate: '',
    maxPayments: '',
    paypalEmail: '',
  });

  // Check if PayPal is already linked
  useEffect(() => {
    if (step === 'details' && isLinked) {
      setFormData(prev => ({ ...prev, paypalEmail: account?.email || '' }));
    }
  }, [isLinked, account, step]);

  // Handle approve success
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success('Success', 'PYUSD allowance approved');
      refetchAllowance();
      setStep('create');
    }
  }, [isApproveSuccess]);

  // Handle create success
  useEffect(() => {
    if (isCreateSuccess) {
      toast.success('Success', 'Subscription created successfully!');
      setStep('success');
    }
  }, [isCreateSuccess]);

  const handleSubmitDetails = () => {
    if (!formData.serviceProviderId || !formData.amount || !formData.interval) {
      toast.error('Error', 'Please fill in all required fields');
      return;
    }

    if (isLinked) {
      setStep('approve');
    } else {
      setStep('paypal');
    }
  };

  const handleLinkPayPal = async () => {
    if (!formData.paypalEmail) {
      toast.error('Error', 'Please enter your PayPal email');
      return;
    }

    const success = await linkAccount(formData.paypalEmail);
    if (success) {
      toast.success('Success', 'PayPal account linked');
      setStep('approve');
    } else {
      toast.error('Error', 'Failed to link PayPal account');
    }
  };

  const handleApprove = async () => {
    try {
      const amount = formData.amount;
      await approve(CONTRACTS.SubChainSubscription as Address, amount);
    } catch (error) {
      console.error('Approve failed:', error);
      toast.error('Error', 'Failed to approve PYUSD');
    }
  };

  const handleCreate = async () => {
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to create a subscription</p>
          <button onClick={onClose} className="btn-secondary w-full">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Subscription</h2>
            <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {['details', 'paypal', 'approve', 'create', 'success'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step === s ? 'bg-paypal-blue text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 4 && <div className="w-12 h-0.5 bg-gray-200 mx-1"></div>}
              </div>
            ))}
          </div>

          {/* Step: Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Provider ID
                </label>
                <input
                  type="text"
                  value={formData.serviceProviderId}
                  onChange={e => setFormData({ ...formData, serviceProviderId: e.target.value })}
                  className="input"
                  placeholder="netflix"
                  disabled={!!service}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (PYUSD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="input"
                  placeholder="15.49"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Interval
                </label>
                <select
                  value={formData.interval}
                  onChange={e => setFormData({ ...formData, interval: parseInt(e.target.value) })}
                  className="input"
                >
                  <option value={PAYMENT_INTERVALS.DAILY}>Daily</option>
                  <option value={PAYMENT_INTERVALS.WEEKLY}>Weekly</option>
                  <option value={PAYMENT_INTERVALS.MONTHLY}>Monthly</option>
                  <option value={PAYMENT_INTERVALS.YEARLY}>Yearly</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Payments (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.maxPayments}
                    onChange={e => setFormData({ ...formData, maxPayments: e.target.value })}
                    className="input"
                    placeholder="12"
                  />
                </div>
              </div>

              <button onClick={handleSubmitDetails} className="btn-primary w-full mt-6">
                Continue
              </button>
            </div>
          )}

          {/* Step: PayPal */}
          {step === 'paypal' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Link PayPal Account</h3>
              <p className="text-gray-600 mb-4">
                Link your PayPal account to receive automatic subscription payments
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PayPal Email
                </label>
                <input
                  type="email"
                  value={formData.paypalEmail}
                  onChange={e => setFormData({ ...formData, paypalEmail: e.target.value })}
                  className="input"
                  placeholder="your@email.com"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('details')} className="btn-secondary flex-1">
                  Back
                </button>
                <button onClick={handleLinkPayPal} className="btn-primary flex-1">
                  Link PayPal
                </button>
              </div>
            </div>
          )}

          {/* Step: Approve */}
          {step === 'approve' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Approve PYUSD</h3>
              <p className="text-gray-600 mb-4">
                Approve the contract to spend PYUSD on your behalf for subscription payments
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Amount to Approve:</span>
                  <span className="font-semibold">{formData.amount} PYUSD</span>
                </div>
              </div>

              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="btn-primary w-full"
              >
                {isApproving ? 'Approving...' : 'Approve PYUSD'}
              </button>
            </div>
          )}

          {/* Step: Create */}
          {step === 'create' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Create Subscription</h3>
              <p className="text-gray-600 mb-4">
                Review your subscription details and create
              </p>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-semibold">{formData.serviceProviderId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">{formData.amount} PYUSD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">PayPal:</span>
                  <span className="font-semibold">{formData.paypalEmail || account?.email}</span>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="btn-primary w-full"
              >
                {isCreating ? 'Creating...' : 'Create Subscription'}
              </button>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Subscription Created!
              </h3>
              <p className="text-gray-600 mb-6">
                Your subscription has been created successfully
              </p>
              <button onClick={onClose} className="btn-primary">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

