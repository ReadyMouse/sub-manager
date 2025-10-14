import { useNavigate } from 'react-router-dom';
import { PaymentTypeCard } from '../components/PaymentTypeCard';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-500 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-4xl font-bold mb-3">
          Subscribe to Anything with Crypto
        </h1>
        <p className="text-lg opacity-90 mb-4">
          Direct wallet-to-wallet recurring payments using PYUSD. The crypto ACH for subscriptions.
        </p>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✓</span>
            <span>Direct PYUSD Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">✓</span>
            <span>Non-Custodial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">✓</span>
            <span>Set & Forget</span>
          </div>
        </div>
      </div>

      {/* Payment Method Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Direct Wallet-to-Wallet Payments
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Automated recurring PYUSD payments with full transparency and control
        </p>
        <div className="max-w-3xl mx-auto">
          <PaymentTypeCard
            type="pyusd"
            title="PYUSD Direct"
            description="Pay with PYUSD stablecoin directly from your wallet to any recipient"
            icon="🪙"
            gradient="bg-gradient-to-br from-green-500 to-green-600"
            features={[
              'Hold PYUSD tokens in your own crypto wallet',
              'Direct blockchain transactions with full transparency',
              'Maintain custody and control of your funds',
              'Programmable payments with smart contract automation',
              'Send to any wallet address - no intermediaries',
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
              Link your crypto wallet with PYUSD tokens
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
            Create a recurring payment to any wallet address
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

