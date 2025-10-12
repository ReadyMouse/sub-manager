import type { MarketplaceService } from '../lib/types';
import { getIntervalLabel, formatUSD } from '../lib/utils';

interface ServiceCardProps {
  service: MarketplaceService;
  onSelect?: (serviceId: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect }) => {
  return (
    <div className="card hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onSelect?.(service.id)}>
      {/* Service Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-5xl">{service.logo}</div>
        {service.paypalSupported && (
          <div className="bg-paypal-blue text-white text-xs px-2 py-1 rounded-full">
            PayPal
          </div>
        )}
      </div>

      {/* Service Info */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-paypal-blue transition-colors">
          {service.name}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{service.description}</p>
        <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
          {service.category}
        </span>
      </div>

      {/* Pricing */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {formatUSD(service.price)}
          </div>
          <div className="text-xs text-gray-500">
            {getIntervalLabel(service.interval)}
          </div>
        </div>
        <button
          className="bg-pyusd-green hover:bg-pyusd-green-dark text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(service.id);
          }}
        >
          Subscribe
        </button>
      </div>
    </div>
  );
};

