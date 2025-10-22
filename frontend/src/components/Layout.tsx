import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletConnect } from './WalletConnect';
import { useAuth } from '../contexts/AuthContext';
import homesImage from '../assets/bw_banner.png';
import paypalLogo from '../assets/paypal_logo.png';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLearnMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/create', label: 'Set Up Payment' },
  ];

  const learnMoreItems = [
    { path: '/for-property-owners', label: 'For Property Owners' },
    { path: '/for-residents', label: 'For Residents' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header with Navigation */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Top Row: Logo and Auth */}
          <div className="flex items-center justify-between">
            {/* Left Side: Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img 
                src={paypalLogo} 
                alt="PayPal" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-brand-navy">StableRent</h1>
                <p className="text-xs text-brand-teal font-medium">PYUSD Recurring Payments</p>
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
              
              {/* Learn More Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setLearnMoreOpen(!learnMoreOpen)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 ${
                    learnMoreItems.some(item => isActive(item.path))
                      ? 'bg-brand-teal text-white shadow-soft'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-brand-navy'
                  }`}
                >
                  Learn More
                  <svg className={`w-4 h-4 transition-transform duration-200 ${learnMoreOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {learnMoreOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {learnMoreItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setLearnMoreOpen(false)}
                        className={`block px-4 py-2 text-sm transition-colors duration-200 ${
                          isActive(item.path)
                            ? 'bg-brand-teal text-white'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-brand-navy'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Right Side: Auth Button, Wallet Connect & Mobile Menu */}
            <div className="flex items-center gap-3">
              <WalletConnect />
              
              {/* Login/Profile Button */}
              {isAuthenticated ? (
                <Link
                  to="/settings"
                  className="px-4 py-3 bg-brand-teal text-white rounded-lg hover:bg-brand-teal-dark transition-colors font-medium flex items-center gap-2"
                >
                  <span className="hidden sm:inline">👤</span>
                  <span className="hidden md:inline">{user?.displayName || 'Profile'}</span>
                  <span className="md:hidden">Profile</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-3 bg-brand-teal text-white rounded-lg hover:bg-brand-teal-dark transition-colors font-medium"
                >
                  Sign In
                </Link>
              )}

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
                
                {/* Mobile Learn More Section */}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Learn More
                  </div>
                  {learnMoreItems.map((item) => (
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
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Banner Image - Only show on home page */}
      {location.pathname === '/' && (
        <div className="w-full mt-16 lg:mt-20">
          <img 
            src={homesImage} 
            alt="StableRent - Professional rental properties" 
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* How it Works Section - Only show on home page */}
      {location.pathname === '/' && (
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-brand-navy mb-4">How StableRent Works</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Connecting property owners and residents with digital currency support for automated, transparent recurring payments.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-medium">1</div>
                <h3 className="text-xl font-bold text-brand-navy mb-3">Find Your Dream Property</h3>
                <p className="text-gray-600 leading-relaxed">
                  Sender links their PYUSD wallet, Recipient provides a PYUSD receive address.
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-medium">2</div>
                <h3 className="text-xl font-bold text-brand-navy mb-3">Sign the Transaction</h3>
                <p className="text-gray-600 leading-relaxed">
                  Sender approves the bulk set of transcations for entire duration of the subscription.
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-medium">3</div>
                <h3 className="text-xl font-bold text-brand-navy mb-3">Set-And-Forget</h3>
                <p className="text-gray-600 leading-relaxed">
                  StableRent handles the payments automatically, on schedule.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className={`px-4 py-8 ${location.pathname !== '/' ? 'mt-16 lg:mt-20' : ''}`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="bg-gradient-to-br from-brand-navy to-brand-teal text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-3">StableRent</h3>
              <p className="text-sm opacity-95 leading-relaxed">
                Professional crypto rent payment platform using PayPal's PYUSD stablecoin for automated, transparent rent transactions.
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

