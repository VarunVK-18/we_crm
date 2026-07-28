import { LogOut, Menu, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate and useLocation
import { useAuth } from '../contexts/AuthContext';
import ConditionalLink from './ConditionalLink';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { currentUser, logout } = useAuth();

  const navigate = useNavigate(); // Initialize useNavigate
  const location = useLocation(); // Get the current location

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Function to handle smooth scrolling, with cross-page navigation
  const handleScrollToElement = (id: string, event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setIsMenuOpen(false);
    setShowUserMenu(false);

    // If we are already on the home page ('/'), just smooth scroll
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      // If we are on any other page (like /dashboard), navigate to home and append the hash
      // The browser will handle the scroll once the home page is loaded with the hash
      navigate(`/#${id}`);
    }
  };

  return (
    <nav className={`fixed top-1 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${isScrolled ? 'w-[96%] sm:w-[95%] max-w-6xl' : 'w-[98%] sm:w-[98%] max-w-7xl'
      }`}>
      <div className={`glass-nav rounded-xl sm:rounded-2xl border border-white/20 shadow-2xl transition-all duration-500 ${isScrolled ? 'bg-white/70 backdrop-blur-xl shadow-xl' : 'bg-white/60 backdrop-blur-lg'
        }`}>
        <div className="px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-1 sm:gap-4 text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
                <img
                  src="/sdlogo.svg"
                  alt="WE"
                  className="h-5 sm:h-8 w-auto"
                />
                <span className="text-black truncate">
                  Startup Doctor
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links: Dashboard, Pricing, Subscription, Contact */}
            <div className="hidden md:flex items-center space-x-8">
              <ConditionalLink
                to="/dashboard"
                className="nav-link text-gray-700 hover:text-gray-900 transition-all duration-300 text-sm font-medium relative"
              >
                Dashboard
              </ConditionalLink>

              {/* Pricing Link - Uses handleScrollToElement */}
              <a
                href="#pricing"
                className="nav-link text-gray-700 hover:text-gray-900 transition-all duration-300 text-sm font-medium relative"
                onClick={(e) => handleScrollToElement('pricing', e)}
              >
                Pricing
              </a>

              {/* Subscription Link */}
              <Link
                to="/subscription"
                className="nav-link text-gray-700 hover:text-gray-900 transition-all duration-300 text-sm font-medium relative"
              >
                Subscription
              </Link>

              {/* Contact Link */}
              <Link
                to="/contact"
                className="nav-link text-gray-700 hover:text-gray-900 transition-all duration-300 text-sm font-medium relative"
              >
                Contact
              </Link>
            </div>

            {/* Right-side elements (User Menu / Login / CTA) - Unchanged */}
            <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-all duration-300 text-sm font-medium px-3 lg:px-4 py-2 rounded-lg hover:bg-white/50 max-w-[120px] lg:max-w-none"
                  >
                    <User size={16} className="flex-shrink-0" />
                    <span className="truncate">
                      {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 py-2 z-50">
                      <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200 truncate">
                        <span className="block truncate" title={currentUser.email || undefined}>
                          {currentUser.email}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white/50 flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <a
                  href={import.meta.env.VITE_CRM_URL || 'https://crm.wealthempires.in/login'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-gray-900 transition-all duration-300 text-sm font-medium px-3 lg:px-4 py-2 rounded-lg hover:bg-white/50"
                >
                  Login
                </a>
              )}
              <ConditionalLink
                to="/health-check"
                requireOnboarding={true}
                className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all duration-300 text-xs lg:text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-block whitespace-nowrap mobile-touch-target"
              >
                Start Health Check
              </ConditionalLink>
            </div>

            <button
              className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-white/50 transition-all duration-300 mobile-touch-target"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={18} className="text-gray-700 sm:w-5 sm:h-5" /> : <Menu size={18} className="text-gray-700 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/20 bg-white/80 backdrop-blur-xl rounded-b-2xl animate-slide-down mobile-nav-menu">
            <div className="px-4 py-4 space-y-3">
              {/* Navigation Links */}
              <ConditionalLink
                to="/dashboard"
                className="block text-gray-700 hover:text-gray-900 py-3 px-3 rounded-lg hover:bg-white/50 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </ConditionalLink>

              {/* Pricing Link (Mobile) - Uses handleScrollToElement */}
              <a
                href="#pricing"
                className="block text-gray-700 hover:text-gray-900 py-3 px-3 rounded-lg hover:bg-white/50 transition-all duration-300"
                onClick={(e) => handleScrollToElement('pricing', e)}
              >
                Pricing
              </a>

              {/* Subscription Link (Mobile) */}
              <Link
                to="/subscription"
                className="block text-gray-700 hover:text-gray-900 py-3 px-3 rounded-lg hover:bg-white/50 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Subscription
              </Link>

              {/* Contact Link (Mobile) */}
              <Link
                to="/contact"
                className="block text-gray-700 hover:text-gray-900 py-3 px-3 rounded-lg hover:bg-white/50 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>

              {/* PDF Preview Link (Mobile) - Development Only */}
              <Link
                to="/pdf-preview"
                className="block text-orange-600 hover:text-orange-800 py-3 px-3 rounded-lg hover:bg-white/50 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                PDF Preview
              </Link>

              {/* Divider */}
              <div className="border-t border-white/20 pt-3">
                {/* User Section */}
                {currentUser ? (
                  <div className="space-y-3">
                    <div className="px-3 py-2 text-sm text-gray-600">
                      <span className="block truncate" title={currentUser.email || undefined}>
                        {currentUser.email}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-gray-700 hover:text-gray-900 py-3 px-3 text-left rounded-lg hover:bg-white/50 transition-all duration-300 flex items-center gap-2"
                    >
                      <LogOut size={16} className="flex-shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 w-full">
                    <a
                      href={import.meta.env.VITE_CRM_URL || 'https://crm.wealthempires.in/login'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mobile-nav-button block w-full text-gray-700 hover:text-gray-900 py-3 px-4 text-center rounded-lg hover:bg-white/50 transition-all duration-300 border border-gray-300 min-h-[48px] flex items-center justify-center font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </a>
                  </div>
                )}

                {/* Start Health Check Button - Always visible */}
                <div className="mt-3 w-full">
                  <ConditionalLink
                    to="/health-check"
                    requireOnboarding={true}
                    className="mobile-nav-button block w-full bg-gradient-to-r from-gray-900 to-gray-700 text-white px-4 py-3 rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all duration-300 shadow-lg text-center font-medium min-h-[48px] flex items-center justify-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Start Health Check
                  </ConditionalLink>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}