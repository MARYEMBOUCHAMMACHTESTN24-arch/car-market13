import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      name: 'Dashboard',
      icon: (
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      href: '/admin',
    },
    {
      name: 'Manage Cars',
      icon: (
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      href: '/admin#cars',
    },
    {
      name: 'Manage Orders',
      icon: (
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      href: '/admin#orders',
    },
  ];

  return (
    <div className="w-72 bg-gray-900 min-h-screen flex flex-col fixed left-0 top-0 z-[60] shadow-2xl">
      {/* Logo Section */}
      <div className="p-8 border-b border-white/5">
        <Link to="/" className="flex flex-col gap-2">
          <img src="/logo/logo-horizontal-dark.svg" alt="AutoMarket Logo" className="h-10 object-contain object-left" />
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest pl-1">Admin Dashboard</p>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 mt-8 px-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`group flex items-center px-4 py-3.5 text-sm font-bold uppercase tracking-wide rounded-xl transition-all duration-300 ${
              location.pathname === item.href
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="mr-4">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>

      {/* User Status */}
      <div className="p-6 mx-4 mb-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center font-black">
            A
          </div>
          <div>
            <p className="text-white text-xs font-bold">Admin User</p>
            <p className="text-gray-500 text-[10px]">admin@cardealer.com</p>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-6 border-t border-white/5">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-gray-400 hover:text-white transition duration-300 rounded-xl bg-white/5 hover:bg-white/10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Exit Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
