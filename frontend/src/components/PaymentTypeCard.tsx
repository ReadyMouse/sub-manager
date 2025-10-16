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
    <div className={`card hover:shadow-strong transition-all duration-300 border-2 ${type === 'paypal' ? 'border-brand-teal/30' : 'border-brand-sage/30'}`}>
      {/* Header with gradient */}
      <div className={`${gradient} rounded-t-xl -mt-6 -mx-6 px-6 py-8 mb-6 shadow-medium`}>
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
            <div className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
              type === 'paypal' ? 'bg-brand-teal' : 'bg-brand-sage'
            }`}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700 flex-1">{feature}</p>
          </div>
        ))}
      </div>

      {/* Info badge */}
      <div className={`mt-auto pt-4 border-t border-gray-200`}>
        <div className={`inline-flex items-center gap-2 text-sm font-semibold ${
          type === 'paypal' ? 'text-brand-teal' : 'text-brand-sage'
        }`}>
          <div className={`w-5 h-5 rounded flex items-center justify-center ${
            type === 'paypal' ? 'bg-brand-teal/10' : 'bg-brand-sage/10'
          }`}>
            <span className="text-xs">i</span>
          </div>
          <span>
            {type === 'paypal' 
              ? 'Traditional PayPal payments in USD'
              : 'Blockchain-based stablecoin payments'}
          </span>
        </div>
      </div>
    </div>
  );
};

