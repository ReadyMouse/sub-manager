interface PaymentTypeCardProps {
  type: 'paypal' | 'pyusd';
  title: string;
  description: string;
  features: string[];
  icon: string;
  gradient: string;
}

export const PaymentTypeCard: React.FC<PaymentTypeCardProps> = ({
  type,
  title,
  description,
  features,
  icon,
  gradient,
}) => {
  return (
    <div className={`card hover:shadow-xl transition-all duration-300 border-2 ${type === 'paypal' ? 'border-paypal-blue' : 'border-pyusd-green'}`}>
      {/* Header with gradient */}
      <div className={`${gradient} rounded-t-xl -mt-6 -mx-6 px-6 py-8 mb-6`}>
        <div className="flex items-center gap-4 mb-3">
          <div className="text-6xl">{icon}</div>
          <h3 className="text-3xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-white/90 text-lg">{description}</p>
      </div>

      {/* Features List */}
      <div className="space-y-4 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              type === 'paypal' ? 'bg-paypal-blue' : 'bg-pyusd-green'
            }`}>
              <span className="text-white text-sm">✓</span>
            </div>
            <p className="text-gray-700 flex-1">{feature}</p>
          </div>
        ))}
      </div>

      {/* Info badge */}
      <div className={`mt-auto pt-4 border-t border-gray-200`}>
        <div className={`inline-flex items-center gap-2 text-sm font-semibold ${
          type === 'paypal' ? 'text-paypal-blue' : 'text-pyusd-green'
        }`}>
          <span>💡</span>
          <span>
            {type === 'paypal' 
              ? 'Traditional PayPal payments in USD'
              : 'Crypto-native stablecoin payments'}
          </span>
        </div>
      </div>
    </div>
  );
};

