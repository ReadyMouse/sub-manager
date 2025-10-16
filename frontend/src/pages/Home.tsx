import { useNavigate } from 'react-router-dom';
import { PaymentTypeCard } from '../components/PaymentTypeCard';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-teal rounded-2xl p-10 mb-8 text-white shadow-strong">
        <h1 className="text-4xl font-bold mb-4 leading-tight">
          Professional Crypto Rent Payments
        </h1>
        <p className="text-lg opacity-95 mb-6 max-w-3xl">
          Automated rent payments using PayPal's PYUSD stablecoin. Direct wallet-to-wallet transfers with blockchain transparency.
        </p>
        <div className="flex items-center gap-8 text-sm flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">PYUSD Stablecoin</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">Non-Custodial</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">Automated Payments</span>
          </div>
        </div>
      </div>

      {/* Payment Method Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-brand-navy mb-3 text-center">
          PYUSD Rent Payment Solution
        </h2>
        <p className="text-gray-600 text-center mb-8 text-lg">
          PayPal-backed stablecoin payments for residential rent with blockchain security
        </p>
        <div className="max-w-3xl mx-auto">
          <PaymentTypeCard
            type="pyusd"
            title="PYUSD Rent Payments"
            description="Automated monthly rent payments using PayPal's PYUSD stablecoin"
            icon="$"
            gradient="bg-gradient-to-br from-brand-sage to-brand-sage-dark"
            features={[
              'PayPal-backed stablecoin pegged to USD for price stability',
              'Automated recurring payments with smart contract technology',
              'Maintain custody of your funds until payment is due',
              'Easy off-ramp to USD through PayPal for landlords',
              'Complete transaction transparency on the blockchain',
            ]}
          />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="mt-12 bg-white rounded-2xl p-10 shadow-medium border border-gray-100">
        <h2 className="text-3xl font-bold text-brand-navy mb-8 text-center">
          How StableRent Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-medium">1</div>
            <h3 className="text-xl font-bold text-brand-navy mb-3">Connect Your Wallet</h3>
            <p className="text-gray-600 leading-relaxed">
              Link your crypto wallet containing PYUSD tokens
            </p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-medium">2</div>
            <h3 className="text-xl font-bold text-brand-navy mb-3">Set Up Rent Payment</h3>
            <p className="text-gray-600 leading-relaxed">
              Configure automated rent payments to your landlord's wallet address
            </p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-medium">3</div>
            <h3 className="text-xl font-bold text-brand-navy mb-3">Automatic Payments</h3>
            <p className="text-gray-600 leading-relaxed">
              Rent is paid automatically each month - never miss a payment
            </p>
          </div>
        </div>
        
        {/* CTA Button */}
        <div className="text-center pt-8 border-t border-gray-200">
          <h3 className="text-2xl font-bold text-brand-navy mb-3">
            Ready to Set Up Rent Payments?
          </h3>
          <p className="text-gray-600 mb-6 text-lg">
            Configure your automated PYUSD rent payment today
          </p>
          <button
            onClick={() => navigate('/create')}
            className="btn-primary text-lg px-10 py-4"
          >
            Set Up Rent Payment
          </button>
        </div>
      </div>
    </div>
  );
};

