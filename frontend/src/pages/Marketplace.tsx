import { useState } from 'react';
import { ServiceCard } from '../components/ServiceCard';
import { POPULAR_SERVICES } from '../lib/constants';
import type { MarketplaceService } from '../lib/types';
import { CreateSubscription } from './CreateSubscription';

export const Marketplace: React.FC = () => {
  const [selectedService, setSelectedService] = useState<MarketplaceService | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSelectService = (serviceId: string) => {
    const service = POPULAR_SERVICES.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service as unknown as MarketplaceService);
      setShowCreateModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setSelectedService(null);
  };

  // Group services by category
  const categories = Array.from(new Set(POPULAR_SERVICES.map(s => s.category)));

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

      {/* Services by Category */}
      {categories.map(category => {
        const services = POPULAR_SERVICES.filter(s => s.category === category);
        return (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => (
                <ServiceCard
                  key={service.id}
                  service={service as unknown as MarketplaceService}
                  onSelect={handleSelectService}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Create Custom Subscription CTA */}
      <div className="mt-12 bg-gray-100 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Don't see your service?
        </h3>
        <p className="text-gray-600 mb-4">
          Create a custom subscription for any PayPal-accepting service
        </p>
        <button
          onClick={() => {
            setSelectedService(null);
            setShowCreateModal(true);
          }}
          className="btn-primary"
        >
          Create Custom Subscription
        </button>
      </div>

      {/* Create Subscription Modal */}
      {showCreateModal && (
        <CreateSubscription
          service={selectedService}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

