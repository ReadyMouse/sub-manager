import type { ToastNotification } from '../lib/types';

interface ToastProps {
  toast: ToastNotification;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-500 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-500 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      case 'info':
        return 'bg-blue-50 border-blue-500 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-900';
    }
  };

  return (
    <div className={`flex items-start p-4 rounded-lg border-l-4 shadow-lg ${getColorClasses()} animate-slide-in`}>
      <div className="flex-shrink-0 text-2xl mr-3">{getIcon()}</div>
      <div className="flex-1">
        <h4 className="font-semibold">{toast.title}</h4>
        <p className="text-sm mt-1 opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 ml-3 text-xl opacity-50 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastNotification[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

