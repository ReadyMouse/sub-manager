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
    </div>
  );
};

