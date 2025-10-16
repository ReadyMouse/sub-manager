import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletConnect } from './WalletConnect';
import homesImage from '../assets/homes.png';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/create', label: 'Set Up Payment' },
    { path: '/subscriptions', label: 'My Rent Payments' },
    { path: '/payments', label: 'Payment History' },
    { path: '/settings', label: 'Settings' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header with Navigation */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Top Row: Logo and Wallet */}
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-brand-navy to-brand-teal text-white px-3 py-2 rounded-xl font-bold text-xl shadow-medium">
                SR
              </div>
              <div>
                <h1 className="text-xl font-bold text-brand-navy">StableRent</h1>
                <p className="text-xs text-brand-teal font-medium">PYUSD Rent Payments</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-brand-teal text-white shadow-soft'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-brand-navy'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right Side: Wallet Connect & Mobile Menu */}
            <div className="flex items-center gap-3">
              <WalletConnect />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-2xl text-gray-600 hover:text-brand-navy transition-colors p-2"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <nav className="lg:hidden mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-brand-teal text-white shadow-soft'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-brand-navy'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Banner Image */}
      <div className="w-full mt-16 lg:mt-20">
        <img 
          src={homesImage} 
          alt="StableRent - Professional rental properties" 
          className="w-full h-auto object-cover"
        />
      </div>

      {/* Main Content */}
      <main className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="bg-gradient-to-br from-brand-navy to-brand-teal text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-3">How it works</h3>
              <p className="text-sm opacity-95 leading-relaxed">
                Approve PYUSD → Automatic wallet-to-wallet payments → Rent paid on time
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3">StableRent</h3>
              <p className="text-sm opacity-95 leading-relaxed">
                Professional crypto rent payment platform using PayPal's PYUSD stablecoin.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3">Learn More</h3>
              <div className="flex flex-col gap-2 text-sm">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="opacity-95 hover:opacity-100 transition-opacity underline">
                  Documentation
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="opacity-95 hover:opacity-100 transition-opacity underline">
                  GitHub Repository
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/20 text-center text-sm opacity-90">
            <p>© 2025 StableRent. Professional PYUSD rent payment platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

