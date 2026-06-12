import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import UserAvatar from '../components/UserAvatar';
import { notificationsAPI } from '../services/api';

const ClientDashboard = ({ user, logout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notificationsRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return { notifications: [], unread_count: 0 };

    setNotificationsLoading(true);
    try {
      const response = await notificationsAPI.getAll();
      const nextNotifications = response.data?.notifications || [];
      const nextUnreadCount = response.data?.unread_count || 0;
      setNotifications(nextNotifications);
      setUnreadCount(nextUnreadCount);
      return { notifications: nextNotifications, unread_count: nextUnreadCount };
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return { notifications: [], unread_count: 0 };
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(interval);
  }, [fetchNotifications, user]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;

    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setDarkMode((current) => !current);
  };

  const toggleSidebar = () => {
    setSidebarOpen((current) => !current);
  };

  const toggleNotifications = async () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);

    if (!nextOpen) return;

    const latest = await fetchNotifications();
    if (latest.unread_count > 0) {
      try {
        await notificationsAPI.markAllAsRead();
        setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
        setUnreadCount(0);
      } catch (err) {
        console.error('Error marking notifications as read:', err);
      }
    }
  };

  const getNotificationAccent = (type) => {
    if (type === 'order_status') return 'bg-blue-500';
    if (type === 'new_request') return 'bg-emerald-500';
    return 'bg-[#5eead4]';
  };

  const navItems = [
    { id: 'dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', label: t('dashboard.sidebar.dashboard'), path: '/client-dashboard' },
    { id: 'requests', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', label: t('dashboard.sidebar.myRequests'), path: '/client-dashboard/requests' },
    { id: 'favorites', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: t('dashboard.sidebar.favorites'), path: '/client-dashboard/favorites' },
    { id: 'orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: t('dashboard.sidebar.myOrders'), path: '/client-dashboard/orders' },
    { id: 'contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: t('dashboard.sidebar.contactAdmin'), path: '/client-dashboard/contact' },
    { id: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: t('dashboard.sidebar.profile'), path: '/client-dashboard/profile' },
    { id: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', label: t('dashboard.sidebar.settings'), path: '/client-dashboard/settings' }
  ];

  return (
    <div className={`client-dashboard-shell ${darkMode ? 'dashboard-dark' : 'dashboard-light'} flex h-screen bg-[#11131a] text-slate-300 font-sans overflow-hidden`}>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-[#161821] flex flex-col justify-between border-r border-slate-800/50 fixed lg:relative inset-y-0 left-0 z-40 shrink-0 overflow-hidden transition-[transform,width] duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0 lg:w-64' : '-translate-x-full lg:-translate-x-full lg:w-0 lg:border-r-0'}`}>
        <div>
          <div className="h-20 flex items-center px-6 border-b border-slate-800/30">
            <Link to="/" className="flex items-center text-white transition-colors">
              <img src="/logo/logo-horizontal-dark.svg" alt="AutoMarket Logo" className="h-8" />
            </Link>
          </div>

          {/* Nav Main Links */}
          <div className="px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (location.pathname === '/dashboard' && item.id === 'dashboard');
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'text-[#5eead4] bg-[#213f3b]/60 border border-[#2a4d47]/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Card Bottom */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <UserAvatar user={user} alt="User Desktop" className="shadow-sm" />
            <div className="flex-1 overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</h4>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-medium text-slate-400 bg-[#1e202d] hover:bg-slate-800 hover:text-white border border-slate-700/50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {t('dashboard.sidebar.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0">

        {/* Top bar */}
        <header className="h-20 bg-[#161821] flex items-center justify-end gap-4 px-4 md:px-8 border-b border-slate-800/50 relative z-[100] pointer-events-auto">

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-3 sm:gap-5 relative pointer-events-auto">
            {/* Language Switcher */}
            <LanguageSwitcher />

            <div className="flex items-center gap-2 bg-[#1b1e2a] rounded-full p-1 border border-slate-800">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-pressed={!darkMode}
                className="p-1.5 rounded-full text-slate-400 hover:text-white transition-all duration-200 bg-[#232736] cursor-pointer relative z-10 active:scale-95"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <svg className="w-4 h-4 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-4 h-4 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                aria-expanded={sidebarOpen}
                className={`p-1.5 rounded-full hover:text-white transition-all duration-200 cursor-pointer relative z-10 active:scale-95 ${sidebarOpen ? 'text-[#5eead4] bg-[#213f3b]' : 'text-slate-500'}`}
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>

            <div className="relative z-50" ref={notificationsRef}>
              <button
                type="button"
                onClick={toggleNotifications}
                aria-label="Toggle notifications"
                aria-expanded={notificationsOpen}
                className={`relative rounded-full p-1.5 transition-all duration-200 cursor-pointer active:scale-95 ${notificationsOpen ? 'text-[#5eead4] bg-[#213f3b]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-[#5eead4] text-[#11131a] text-[10px] font-bold ring-2 ring-[#161821]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-800 bg-[#161821] shadow-2xl shadow-black/30 overflow-hidden animate-scale-in">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/70">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{t('common.notifications', 'Notifications')}</h3>
                      <p className="text-xs text-slate-500">{unreadCount} unread</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="p-1.5 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                      aria-label="Close notifications"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notificationsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-7 h-7 border-2 border-slate-700 border-t-[#5eead4] rounded-full animate-spin"></div>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-6 py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-800/60 mx-auto mb-3 flex items-center justify-center text-slate-500">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-400">No notifications</p>
                        <p className="text-xs text-slate-600 mt-1">You're all caught up.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800/70">
                        {notifications.slice(0, 8).map((notification) => {
                          const content = (
                            <div className={`flex gap-3 px-5 py-4 transition-colors hover:bg-slate-800/40 ${!notification.read ? 'bg-[#1b3d39]/20' : ''}`}>
                              <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${getNotificationAccent(notification.type)}`}></div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className={`text-sm font-semibold truncate ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                                    {notification.title}
                                  </h4>
                                  {!notification.read && (
                                    <span className="rounded-full bg-[#5eead4]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#5eead4] shrink-0">New</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed mt-1 line-clamp-2">{notification.message}</p>
                                <p className="text-[11px] text-slate-600 mt-2">
                                  {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          );

                          return notification.link ? (
                            <Link
                              key={notification.id}
                              to={notification.link}
                              onClick={() => setNotificationsOpen(false)}
                              className="block"
                            >
                              {content}
                            </Link>
                          ) : (
                            <div key={notification.id}>{content}</div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/client-dashboard/profile"
              className="flex items-center gap-2 pl-2 border-l border-slate-700/50 hover:text-[#5eead4] transition-colors relative z-50 cursor-pointer"
            >
              <UserAvatar user={user} alt="Avatar" sizeClass="w-7 h-7" textClass="text-xs" />
              <span className="text-sm font-medium text-white">{user?.name?.split(' ')[0] || 'User'}</span>
              <svg className="w-4 h-4 text-slate-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </Link>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#11131a] custom-scrollbar">
          <Outlet />
        </main>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #11131a; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a2d3d; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f4459; 
        }
      `}</style>
    </div>
  );
};

export default ClientDashboard;
