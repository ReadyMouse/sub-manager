interface AutomationStatusProps {
  provider: 'chainlink' | 'gelato' | null;
  isActive?: boolean;
}

export const AutomationStatus: React.FC<AutomationStatusProps> = ({ provider, isActive = true }) => {
  if (!provider) {
    return (
      <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
        <span>Manual Processing</span>
      </div>
    );
  }

  const getProviderInfo = () => {
    switch (provider) {
      case 'chainlink':
        return {
          name: 'Chainlink Automation',
          icon: '🔗',
          color: 'blue',
        };
      case 'gelato':
        return {
          name: 'Gelato Network',
          icon: '🍦',
          color: 'purple',
        };
      default:
        return {
          name: 'Unknown',
          icon: '❓',
          color: 'gray',
        };
    }
  };

  const info = getProviderInfo();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      isActive
        ? `bg-${info.color}-50 text-${info.color}-700`
        : 'bg-gray-100 text-gray-700'
    }`}>
      <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
      <span className="text-lg">{info.icon}</span>
      <span className="font-medium">
        Automated via {info.name}
      </span>
    </div>
  );
};

