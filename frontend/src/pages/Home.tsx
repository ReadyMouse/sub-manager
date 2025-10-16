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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <PaymentTypeCard
            type="pyusd"
            title="For Residents"
            description="Never miss rent again with automated PYUSD payments"
            icon=""
            gradient="bg-gradient-to-br from-brand-teal to-brand-navy"
            features={[
              'Set up once and payments happen automatically each month',
              'Maintain full custody of your funds until payment is due',
              'Pay from anywhere with just a crypto wallet',
              'Track all payment history on the blockchain',
              'Cancel or modify your subscription anytime',
            ]}
          />
          <PaymentTypeCard
            type="pyusd"
            title="For Property Owners"
            description="Receive rent payments directly to your wallet, on time"
            icon=""
            gradient="bg-gradient-to-br from-brand-sage to-brand-sage-dark"
            features={[
              'Receive guaranteed on-time payments every month',
              'Easy conversion to USD through PayPal',
              'No chargebacks or payment reversals',
              'Complete transparency with blockchain records',
              'Lower transaction fees compared to traditional methods',
            ]}
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-12 bg-white rounded-2xl p-10 shadow-medium border border-gray-100 text-center">
        <h3 className="text-3xl font-bold text-brand-navy mb-4">
          Ready to Set Up Rent Payments?
        </h3>
        <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
          Configure your automated PYUSD rent payment today and never worry about missing rent again
        </p>
        <button
          onClick={() => navigate('/create')}
          className="btn-primary text-lg px-10 py-4"
        >
          Set Up Rent Payment
        </button>
      </div>
    </div>
  );
};

