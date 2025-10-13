import { useNavigate } from 'react-router-dom';
import { PaymentTypeCard } from '../components/PaymentTypeCard';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-paypal-blue to-pyusd-green rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-4xl font-bold mb-3">
          Subscribe to Anything with Crypto
        </h1>
        <p className="text-lg opacity-90 mb-4">
          Pay for your favorite services using PYUSD. Automatic payments via PayPal.
        </p>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✓</span>
            <span>Auto-Convert PYUSD</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">✓</span>
            <span>PayPal Integration</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">✓</span>
            <span>Set & Forget</span>
          </div>
        </div>
      </div>

      {/* Payment Types Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Choose Your Payment Method
        </h2>
        <p className="text-gray-600 text-center mb-8">
          SubChain supports two flexible payment types to suit your needs
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <PaymentTypeCard
            type="paypal"
            title="Via PayPal USD"
            description="Use PayPal balance for seamless payments"
            icon="💳"
            gradient="bg-gradient-to-br from-paypal-blue to-blue-600"
            features={[
              'Hold PYUSD tokens in your own crypto wallet',
              'PYUSD withdrawn as needed for payments',
              'Integration with all PayPal-accepting services',
              'Crypto-to-Fiat conversion handled automatically',
            ]}
          />
          <PaymentTypeCard
            type="pyusd"
            title="Via PYUSD"
            description="Pay with PYUSD stablecoin directly from your wallet"
            icon="🪙"
            gradient="bg-gradient-to-br from-pyusd-green to-green-600"
            features={[
              'Hold PYUSD tokens in your own crypto wallet',
              'Direct blockchain transactions with full transparency',
              'Maintain custody and control of your funds',
              'Programmable payments with smart contract automation',
            ]}
          />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          How SubChain Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="text-5xl mb-3">1️⃣</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600">
              Link your crypto wallet and optionally connect your PayPal account
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-3">2️⃣</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create Subscription</h3>
            <p className="text-gray-600">
              Set up automated payments to any service provider with flexible intervals
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-3">3️⃣</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Set & Forget</h3>
            <p className="text-gray-600">
              Payments happen automatically - no manual intervention needed
            </p>
          </div>
        </div>
        
        {/* CTA Button */}
        <div className="text-center pt-6 border-t border-gray-300">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Get Started?
          </h3>
          <p className="text-gray-600 mb-4">
            Create a subscription for any PayPal-accepting service
          </p>
          <button
            onClick={() => navigate('/create')}
            className="btn-primary text-lg px-8 py-3"
          >
            Create Your First Subscription
          </button>
        </div>
      </div>
    </div>
  );
};

