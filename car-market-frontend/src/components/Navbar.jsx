import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { notificationsAPI } from '../services/api';
import Notifications from './Notifications';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = ({ user, logout }) => {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getAll();
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const navLinks = [
    { label: t('navbar.home'), path: '/' },
    { label: t('navbar.cars'), path: '/cars' },
    { label: 'Offers', path: '/offers' },
    { label: 'Blog', path: '/blog' },
    { label: t('navbar.aboutUs'), path: '/about' },
    { label: t('navbar.contact'), path: '/contact' },
  ];

  const navBg = scrolled
    ? 'bg-white shadow-lg'
    : isHome
      ? 'bg-transparent'
      : 'bg-white shadow-sm';

  const textColor = isHome && !scrolled ? 'text-white' : 'text-gray-700';
  const logoColor = isHome && !scrolled ? 'text-white' : 'text-gray-900';
  const activeColor = 'text-red-600';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 md:h-[72px] items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={isHome && !scrolled ? '/logo/logo-horizontal-dark.svg' : '/logo/logo-horizontal.svg'} 
              alt="AutoMarket Logo" 
              className="h-10 transition-all duration-300"
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 rounded-lg hover:text-red-600 ${location.pathname === link.path
                  ? activeColor
                  : textColor
                  }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'manager' ? '/manager-dashboard' : '/client-dashboard'}
                className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 rounded-lg hover:text-red-600 ${location.pathname.includes('dashboard') ? activeColor : textColor
                  }`}
              >
                {t('navbar.dashboard')}
              </Link>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />
            {/* Notification Bell */}
            {user && (
              <button
                onClick={() => setShowNotifications(true)}
                className={`relative p-2 rounded-lg transition-colors ${isHome && !scrolled ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth Buttons */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'manager' ? '/manager-dashboard' : '/client-dashboard'}
                  className={`p-2 rounded-lg transition-colors ${isHome && !scrolled ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
                >
                  {t('navbar.logout')}
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${isHome && !scrolled
                    ? 'text-white hover:text-red-400'
                    : 'text-gray-700 hover:text-red-600'
                    }`}
                >
                  {t('navbar.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
                >
                  {t('navbar.signUp')}
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2">
              <svg className={`w-6 h-6 transition-colors ${isHome && !scrolled ? 'text-white' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-4 py-3 rounded-lg text-sm font-semibold ${location.pathname === link.path ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'manager' ? '/manager-dashboard' : '/client-dashboard'} className="block px-4 py-3 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                {t('navbar.dashboard')}
              </Link>
            )}
            <div className="pt-4 border-t border-gray-100 flex gap-3">
              {user ? (
                <button onClick={logout} className="flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors">{t('navbar.logout')}</button>
              ) : (
                <>
                  <Link to="/login" className="flex-1 border border-gray-300 text-gray-700 text-sm font-semibold py-2.5 rounded-lg text-center hover:border-red-600 hover:text-red-600 transition-colors">{t('navbar.login')}</Link>
                  <Link to="/register" className="flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-lg text-center hover:bg-red-700 transition-colors">{t('navbar.signUp')}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      <Notifications isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </header>
  );
};

export default Navbar;
