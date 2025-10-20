import { useNavigate } from 'react-router-dom';
import { PaymentTypeCard } from '../components/PaymentTypeCard';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Payment Method Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-brand-navy mb-3 text-center">
          Rent Payment Solution
        </h2>
        <p className="text-gray-600 text-center mb-8 text-lg">
          PayPal-backed stablecoin automation for recurring payments
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <PaymentTypeCard
            type="pyusd"
            title="For Residents"
            description="Never miss rent again with automated payments"
            icon=""
            gradient="bg-gradient-to-br from-brand-teal to-brand-navy"
            features={[
              'Set up once and payments happen automatically each month',
              'Maintain full custody of your funds until payment is due',
              'Track all payment history on the blockchain',
              'Cancel or modify your subscription anytime',
            ]}
            onClick={() => navigate('/for-residents')}
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
            ]}
            onClick={() => navigate('/for-property-owners')}
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-12 bg-white rounded-2xl p-10 shadow-medium border border-gray-100 text-center">
        <h3 className="text-3xl font-bold text-brand-navy mb-4">
          Ready to Set Up Payments?
        </h3>
        <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
          Configure your automated rent payment today and never worry about missing rent again
        </p>
        <button
          onClick={() => navigate('/create')}
          className="btn-primary text-lg px-10 py-4"
        >
          Set Up Recurring Payment
        </button>
      </div>

      {/* Payy Visa Card Integration Section */}
      <div className="mt-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-10 shadow-medium border border-purple-100">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-brand-navy mb-3">
              🏦 Use with Payy Visa Card
            </h3>
            <p className="text-gray-700 mb-4 text-lg leading-relaxed">
              <strong>For Residents:</strong> Property owner doesn't want a PayPal account? No problem! Use this automation to automatically refill your <a href="https://payy.link/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 underline font-semibold">Payy Card</a> balance before rent comes due.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Send crypto to your Payy card, automatically convert to USD on payment</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Use your Payy Visa card anywhere Visa is accepted—no PayPal account required</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Set up automation to ensure your card is always funded when you need it</span>
              </li>
            </ul>
            <div className="mt-6 pt-6 border-t border-purple-200">
              <p className="text-sm text-gray-500 italic">
                Perfect for crypto-native residents and property management companies who prefer traditional banking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

