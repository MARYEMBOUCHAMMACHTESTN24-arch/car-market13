import { useState, useEffect } from 'react';
import { useLocation, Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ordersAPI, carsAPI, usersAPI } from '../services/api';
import DashboardOrders from './DashboardOrders';
import Clients from './Clients';
import CarsList from './CarsList'; // I'll assume we have a component or create one

const ManagerDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'orders', label: 'Orders', icon: '📋', path: 'orders' },
    { id: 'clients', label: 'Clients', icon: '👥', path: 'clients' },
    { id: 'stock', label: 'Cars Stock', icon: '🚗', path: 'stock' },
  ];

  // Sync active tab with URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'manager-dashboard') {
      setActiveTab('orders');
      navigate('orders', { replace: true });
    } else {
      setActiveTab(path);
    }
  }, [location, navigate]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold tracking-tight">Manager Portal</h2>
          <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors text-sm font-medium">
            <span>🏠</span> Back to Home
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {menuItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <p className="text-slate-500 text-sm">Manage orders and view stock availability.</p>
          </div>
          <div className="flex items-center gap-4">
             <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">Manager Role</span>
          </div>
        </header>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[600px]">
          <Routes>
            <Route path="orders" element={<DashboardOrders user={user} isReadOnly={true} />} />
            <Route path="clients" element={<Clients />} />
            <Route path="stock" element={<CarsList isReadOnly={true} />} />
            <Route path="/" element={<Navigate to="orders" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
