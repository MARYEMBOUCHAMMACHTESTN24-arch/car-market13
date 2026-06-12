import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { authAPI, carsAPI, ordersAPI, messagesAPI, usersAPI, analyticsAPI, notificationsAPI } from '../services/api';
import AdminPromotions from './AdminPromotions';
import AdminCategories from './AdminCategories';
import Clients from './Clients';
import DashboardOrders from './DashboardOrders';
import Messages from './Messages';
import CarsList from './CarsList';
import Admins from './Admins';
import Settings from './Settings';
import AiAdminDashboard from './AiAdminDashboard';
import BusinessDashboard from './BusinessDashboard';
import LanguageSwitcher from '../components/LanguageSwitcher';

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#D32F2F', '#1F2937', '#374151', '#B71C1C', '#EF5350'];

const Icons = {
  menu: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  grid: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  car: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>,
  plus: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>,
  tag: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  bag: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  transactions: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  users: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  admins: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  settings: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  logout: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  bell: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  search: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  calendar: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  eye: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  edit: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  trash: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
};

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#111827] rounded-3xl border border-white/5 shadow-2xl p-8 text-center">
    <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
      <svg className="w-10 h-10 text-am-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
    <p className="text-slate-400 max-w-md">You do not have the required permissions to view this section. Please contact a root administrator if you believe this is an error.</p>
  </div>
);


const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [sec, setSec] = useState('');
  const [stats, setStats] = useState({ totalCars: 0, totalOrders: 0, totalUsers: 0, revenue: 0 });
  const [chartsData, setChartsData] = useState({ monthlyOrders: [], monthlyCars: [], carsByCategory: [] });
  const [latestCarsData, setLatestCarsData] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  console.log(notifications);
  console.log(open);

  const toggleNotifications = () => {
    setOpen(!open);
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      if (res.data && res.data.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error('Error marking all notifications as read:', e);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const u = stored ? JSON.parse(stored) : null;
    
    // Always fetch fresh user data to ensure permissions are up to date
    authAPI.getUser().then(res => {
      const apiUser = res.data?.user || res.data;
      const freshUser = {
        ...apiUser,
        role: res.data?.role || apiUser.role,
        permissions: res.data?.permissions || apiUser.permissions || []
      };
      
      if (!freshUser || (freshUser.role !== 'admin' && freshUser.role !== 'manager')) {
        window.location.href = '/login';
        return;
      }
      
      console.log('╔══════════════════════════════╗');
      console.log('║     RBAC SYSTEM INFO         ║');
      console.log('╚══════════════════════════════╝');
      console.log('Role:', freshUser.role);
      console.log('Permissions:', freshUser.permissions);
      console.log('Dashboard access (view_dashboard):', freshUser.role === 'admin' || (freshUser.permissions || []).some(p => (typeof p === 'string' ? p : p.name) === 'view_dashboard'));
      console.log('BI Dashboard access (view_bi_dashboard):', freshUser.role === 'admin' || (freshUser.permissions || []).some(p => (typeof p === 'string' ? p : p.name) === 'view_bi_dashboard'));
      console.log('Revenue access (view_revenue):', freshUser.role === 'admin' || (freshUser.permissions || []).some(p => (typeof p === 'string' ? p : p.name) === 'view_revenue'));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      localStorage.setItem('user', JSON.stringify(freshUser));
      localStorage.setItem('role', freshUser.role);
      setUser(freshUser);
      loadData();
    }).catch(() => { 
      // If API fails but we have a valid stored user, fallback to it
      if (u && (u.role === 'admin' || u.role === 'manager')) {
        setUser(u);
        loadData();
      } else {
        window.location.href = '/login'; 
      }
    });
  }, []);

  const hasPermission = (permissionName) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    return user.permissions.some(p => {
      const pName = typeof p === 'string' ? p : p.name;
      return pName === permissionName;
    });
  };

  useEffect(() => {
    if (user) {
      if (hasPermission('view_dashboard')) setSec('overview');
      else if (hasPermission('view_cars')) setSec('cars');
      else if (hasPermission('view_orders')) setSec('orders');
      else if (hasPermission('view_users')) setSec('clients');
      else if (hasPermission('view_categories')) setSec('categories');
      else if (hasPermission('view_offers')) setSec('promotions');
      else if (hasPermission('view_messages')) setSec('messages');
      else if (hasPermission('view_ai_analytics')) setSec('ai-analytics');
      else if (hasPermission('view_settings')) setSec('settings');
      else setSec('overview'); // fallback to show access denied
    }
  }, [user]);

  const showToast = (m, t = 'success') => {
    setToast({ m, t });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.getDashboardData();
      if (res.data) {
        setStats(res.data.stats || { totalCars: 0, totalOrders: 0, totalUsers: 0, revenue: 0 });
        setChartsData(res.data.charts || { monthlyOrders: [], monthlyCars: [], carsByCategory: [] });
        const cars = res.data.latestCars || [];
        setLatestCarsData(cars);
        setFilteredCars(cars);
      }
    } catch (e) {
      console.error('Dashboard Error:', e);
      showToast('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCars(latestCarsData);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredCars(latestCarsData.filter(c => 
        c.brand.toLowerCase().includes(term) || 
        c.model.toLowerCase().includes(term)
      ));
    }
  }, [searchTerm, latestCarsData]);

  const handleDeleteCar = async (id) => {
    if (!window.confirm('Are you sure you want to delete this car?')) return;
    try {
      await carsAPI.delete(id);
      showToast('Car deleted successfully');
      loadData();
    } catch (e) {
      showToast('Error deleting car', 'error');
    }
  };

  const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`}></div>
  );

  if (loading && !user) return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">{t('common.loading')}</div>;

  const isRtl = i18n.language?.startsWith('ar');

  return (
    <div className="min-h-screen bg-[#0B0F19] flex font-sans text-slate-300" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sidebar - PHOTO COPY REPLICA */}
      <aside className={`w-[280px] bg-[#111827] flex flex-col fixed h-full z-50 border-white/5 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-am-red rounded-xl flex items-center justify-center text-white shadow-lg shadow-am-red/30">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">AutoMarket</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {hasPermission('view_dashboard') && (
            <>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2 mt-4">{t('admin.overview')}</div>
              <button onClick={() => setSec('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${sec === 'overview' ? 'bg-am-red text-white shadow-lg shadow-am-red/20' : 'hover:bg-white/5'}`}>
                {Icons.grid} <span className="font-semibold">{t('admin.dashboard')}</span>
              </button>
            </>
          )}

          {(hasPermission('view_cars') || hasPermission('manage_cars') || hasPermission('view_categories') || hasPermission('view_offers')) && (
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2 mt-6">{t('admin.sidebar_section_cars')}</div>
          )}
          {hasPermission('view_cars') && (
            <button onClick={() => setSec('cars')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${sec === 'cars' ? 'bg-am-red text-white' : 'hover:bg-white/5'}`}>
              {Icons.car} <span className="font-semibold">{t('admin.sidebar_all_cars')}</span>
            </button>
          )}
          {hasPermission('manage_cars') && (
            <button onClick={() => setSec('cars')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all">
              {Icons.plus} <span className="font-semibold">{t('admin.sidebar_add_car')}</span>
            </button>
          )}
          {hasPermission('view_categories') && (
            <button onClick={() => setSec('categories')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${sec === 'categories' ? 'bg-am-red text-white' : 'hover:bg-white/5'}`}>
              {Icons.tag} <span className="font-semibold">{t('admin.sidebar_categories')}</span>
            </button>
          )}
          {hasPermission('view_offers') && (
            <button onClick={() => setSec('promotions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${sec === 'promotions' ? 'bg-am-red text-white' : 'hover:bg-white/5'}`}>
              {Icons.tag} <span className="font-semibold">Offers</span>
            </button>
          )}

          {(hasPermission('view_orders') || hasPermission('manage_orders')) && (
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2 mt-6">{t('admin.sidebar_section_orders')}</div>
          )}
          {hasPermission('view_orders') && (
            <button onClick={() => setSec('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${sec === 'orders' ? 'bg-am-red text-white' : 'hover:bg-white/5'}`}>
              {Icons.bag} <span className="font-semibold">{t('admin.sidebar_all_orders')}</span>
            </button>
          )}
          {hasPermission('view_revenue') && (
            <button onClick={() => setSec('orders')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all">
              {Icons.transactions} <span className="font-semibold">{t('admin.sidebar_transactions')}</span>
            </button>
          )}

          {(hasPermission('view_users') || hasPermission('manage_users') || hasPermission('view_messages')) && (
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2 mt-6">{t('admin.sidebar_section_users')}</div>
          )}
          {hasPermission('view_users') && (
            <button onClick={() => setSec('clients')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${sec === 'clients' ? 'bg-am-red text-white' : 'hover:bg-white/5'}`}>
              {Icons.users} <span className="font-semibold">{t('admin.sidebar_all_users')}</span>
            </button>
          )}
          {hasPermission('admins.view') && (
            <button onClick={() => setSec('admins')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${sec === 'admins' ? 'bg-am-red text-white' : 'hover:bg-white/5'}`}>
              {Icons.admins} <span className="font-semibold">{t('admin.sidebar_admins')}</span>
            </button>
          )}
          {hasPermission('view_messages') && (
            <button onClick={() => setSec('messages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${sec === 'messages' ? 'bg-am-red text-white' : 'hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <span className="font-semibold">{t('admin.sidebar_messages')}</span>
            </button>
          )}

          {(hasPermission('view_ai_analytics') || hasPermission('view_settings')) && (
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2 mt-6">{t('admin.sidebar_section_settings')}</div>
          )}
          {hasPermission('view_ai_analytics') && (
            <button onClick={() => setSec('ai-analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${sec === 'ai-analytics' ? 'bg-am-red text-white' : 'hover:bg-white/5'}`}>
              <span className="text-xl">🧠</span> <span className="font-semibold">AI Analytics</span>
            </button>
          )}
          {hasPermission('view_settings') && (
            <button onClick={() => setSec('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${sec === 'settings' ? 'bg-am-red text-white' : 'hover:bg-white/5'}`}>
              {Icons.settings} <span className="font-semibold">{t('admin.sidebar_settings')}</span>
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => { authAPI.logout(); localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('role'); window.location.href = '/login'; }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 hover:text-am-red transition-all font-semibold group text-am-red/70">
            {Icons.logout} <span>{t('admin.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 min-w-0 min-h-screen flex flex-col overflow-x-hidden ${isRtl ? 'mr-[280px]' : 'ml-[280px]'}`}>
        {/* Header - PHOTO COPY REPLICA */}
        <header className="h-20 bg-[#0B0F19] border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-8 w-full max-w-xl">
            <button className="text-slate-400 hover:text-white">{Icons.menu}</button>
            <div className="relative w-full group">
              <span className={`absolute top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors ${isRtl ? 'right-4' : 'left-4'}`}>{Icons.search}</span>
              <input 
                type="text" 
                placeholder={t('admin.navbar_search')} 
                className={`w-full py-2.5 bg-[#111827] border border-white/5 rounded-xl text-sm text-white outline-none focus:border-red-500/30 transition-all ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'}`} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            {hasPermission('view_notifications') && (
              <div className="relative">
                <button 
                  onClick={toggleNotifications} 
                  className="text-slate-400 hover:text-white relative flex items-center"
                >
                  {Icons.bell}
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-am-red text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-[#0B0F19]">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#111827] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <span className="font-bold text-white">Notifications</span>
                      {notifications.filter(n => !n.read).length > 0 && (
                        <button 
                          onClick={markAllAsRead} 
                          className="text-xs text-red-500 hover:text-red-400 font-bold"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-sm">
                          No notifications
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            className={`p-4 transition-colors hover:bg-white/5 ${!n.read ? 'bg-white/[0.02]' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <p className={`text-sm font-semibold ${!n.read ? 'text-white' : 'text-slate-400'}`}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {n.message}
                                </p>
                              </div>
                              <button 
                                onClick={() => deleteNotification(n.id)} 
                                className="text-slate-500 hover:text-red-500 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-slate-500">
                                {new Date(n.created_at).toLocaleDateString()}
                              </span>
                              {!n.read && (
                                <button 
                                  onClick={() => markAsRead(n.id)} 
                                  className="text-[10px] text-red-500 hover:text-red-400 font-bold"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Dynamic i18n Language Switcher in Header */}
            <LanguageSwitcher />

            <div className={`flex items-center gap-3 border-white/10 ${isRtl ? 'border-r pr-6' : 'border-l pl-6'}`}>
              <div className={isRtl ? 'text-left' : 'text-right'}>
                <p className="text-sm font-bold text-white leading-none">{t('navbar.admin')}</p>
                <p className="text-[11px] text-slate-500 mt-1">{t('admin.navbar_role')}</p>
              </div>
              <img src="https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff" alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="min-w-0 p-5 md:p-8 lg:p-10 space-y-8">
          {sec === 'overview' && (hasPermission('view_dashboard') || hasPermission('view_bi_dashboard') ? <BusinessDashboard /> : <AccessDenied />)}
          {sec === 'cars' && (hasPermission('view_cars') ? <CarsList showToast={showToast} /> : <AccessDenied />)}
          {sec === 'orders' && (hasPermission('view_orders') ? <DashboardOrders showToast={showToast} user={user} /> : <AccessDenied />)}
          {sec === 'promotions' && (hasPermission('view_offers') ? <AdminPromotions showToast={showToast} /> : <AccessDenied />)}
          {sec === 'categories' && (hasPermission('view_categories') ? <AdminCategories showToast={showToast} /> : <AccessDenied />)}
          {sec === 'messages' && (hasPermission('view_messages') ? <Messages showToast={showToast} /> : <AccessDenied />)}
          {sec === 'clients' && (hasPermission('view_users') ? <Clients showToast={showToast} /> : <AccessDenied />)}
          {sec === 'admins' && (hasPermission('admins.view') ? <Admins showToast={showToast} /> : <AccessDenied />)}
          {sec === 'ai-analytics' && (hasPermission('view_ai_analytics') ? <AiAdminDashboard /> : <AccessDenied />)}
          {sec === 'settings' && (hasPermission('view_settings') ? <Settings showToast={showToast} /> : <AccessDenied />)}
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className={`fixed bottom-10 z-[100] ${isRtl ? 'left-10' : 'right-10'}`}>
              <div className={`px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border ${toast.t === 'success' ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400' : 'bg-am-red/20 border-red-500/30 text-red-400'}`}>
                <span className="font-bold text-sm tracking-wide">{toast.m}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminDashboard;



