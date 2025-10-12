import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletConnect } from './WalletConnect';
import { PayPalConnect } from './PayPalConnect';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Marketplace', icon: '🛒' },
    { path: '/subscriptions', label: 'My Subscriptions', icon: '📋' },
    { path: '/payments', label: 'Payment History', icon: '💰' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Logo & Mobile Menu Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-2xl text-gray-600"
            >
              ☰
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="text-3xl">⛓️</span>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">SubChain</h1>
                <p className="text-xs text-gray-500">Crypto Subscriptions</p>
              </div>
            </Link>
          </div>

          {/* Wallet & PayPal Connection */}
          <div className="flex items-center gap-3">
            <PayPalConnect />
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-30">
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-paypal-blue text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer Info */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gradient-to-r from-paypal-blue to-pyusd-green p-4 rounded-lg text-white text-sm">
            <p className="font-semibold mb-1">💡 How it works</p>
            <p className="text-xs opacity-90">
              Approve PYUSD → Auto-convert → PayPal payout → Subscription paid
            </p>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <aside className="md:hidden fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-50">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-paypal-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="md:ml-64 mt-16 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

