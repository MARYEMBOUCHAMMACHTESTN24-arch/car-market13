import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ordersAPI, messagesAPI } from '../services/api';

const DashboardHome = ({ user }) => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [adminMessages, setAdminMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, messagesRes] = await Promise.all([
          ordersAPI.getAll().catch(() => ({ data: [] })),
          messagesAPI.getClientMessages().catch(() => ({ data: { messages: [], unread_count: 0 } }))
        ]);
        
        if (ordersRes && ordersRes.data) {
          setOrders(ordersRes.data);
        }
        const messages = Array.isArray(messagesRes?.data)
          ? messagesRes.data
          : messagesRes?.data?.messages || [];
        console.log(messages);
        setAdminMessages(messages);
        if (messagesRes?.data && !Array.isArray(messagesRes.data)) {
          setUnreadMessages(messagesRes.data.unread_count || 0);
        } else {
          setUnreadMessages(messages.filter((message) => !message.is_read).length);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user]);

  // Derived statistics
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => 
    o.status?.toLowerCase() === 'completed' || 
    o.status?.toLowerCase() === 'approved' || 
    o.status?.toLowerCase() === 'accepted'
  ).length;
  const pendingOrders = orders.filter(o => o.status?.toLowerCase() === 'pending').length;
  const canceledOrders = orders.filter(o => 
    o.status?.toLowerCase() === 'canceled' || 
    o.status?.toLowerCase() === 'rejected'
  ).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-wide mb-1">
          {t('dashboard.welcome')}, {user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-slate-400 text-sm">{t('dashboard.overview')}</p>
      </div>

      {/* Next Row: 4 Stat Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {/* Total Orders */}
        <div className="bg-[#1b1e2a] rounded-2xl p-5 border border-slate-800/50 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-3xl font-bold text-white mb-1">{totalOrders}</h3>
              <p className="text-xs text-slate-400 font-medium">{t('dashboard.totalOrders')}</p>
            </div>
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 shadow-inner border border-slate-700/50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-gradient-to-br from-[#102b28] to-[#16302e] rounded-2xl p-5 shadow-[0_4px_20px_rgba(20,83,73,0.15)] border border-[#1b3d39]">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-3xl font-bold text-white mb-1">{completedOrders}</h3>
              <p className="text-xs text-[#6ee7b7] font-medium">{t('dashboard.completed')}</p>
            </div>
            <div className="w-8 h-8 bg-[#1f423d] rounded-lg flex items-center justify-center text-[#6ee7b7] shadow-inner border border-[#2a5953]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-gradient-to-br from-[#3b2a16] to-[#45321a] rounded-2xl p-5 shadow-[0_4px_20px_rgba(113,76,28,0.15)] border border-[#5c4021]">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-3xl font-bold text-white mb-1">{pendingOrders}</h3>
              <p className="text-xs text-[#fbbf24] font-medium">{t('dashboard.pending')}</p>
            </div>
            <div className="w-8 h-8 bg-[#523d24] rounded-lg flex items-center justify-center text-[#fbbf24] shadow-inner border border-[#6b5030]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>

        {/* Canceled */}
        <div className="bg-gradient-to-br from-[#3b181a] to-[#451e20] rounded-2xl p-5 shadow-[0_4px_20px_rgba(113,30,34,0.15)] border border-[#5c272a]">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-3xl font-bold text-white mb-1">{canceledOrders}</h3>
              <p className="text-xs text-[#fda4af] font-medium">{t('dashboard.canceled')}</p>
            </div>
            <div className="w-8 h-8 bg-[#52252a] rounded-lg flex items-center justify-center text-[#fda4af] shadow-inner border border-[#6b3137]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row Layout: 2 Cols */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Main Content Area: Overview */}
        <div className="xl:col-span-2 space-y-6">

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-4">
            <Link to="/cars" className="bg-[#1b1e2a] rounded-xl p-4 border border-slate-800/50 hover:border-[#5eead4]/30 transition-colors group">
              <div className="w-10 h-10 bg-[#213f3b] rounded-lg flex items-center justify-center text-[#5eead4] mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h3 className="text-white text-sm font-medium group-hover:text-[#5eead4] transition-colors">{t('dashboard.quickActions.browseCars')}</h3>
              <p className="text-xs text-slate-500 mt-1">{t('dashboard.quickActions.browseCarsDesc')}</p>
            </Link>
            <Link to="/client-dashboard/orders" className="bg-[#1b1e2a] rounded-xl p-4 border border-slate-800/50 hover:border-[#5eead4]/30 transition-colors group">
              <div className="w-10 h-10 bg-[#3b2a16] rounded-lg flex items-center justify-center text-[#fbbf24] mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-white text-sm font-medium group-hover:text-[#5eead4] transition-colors">{t('dashboard.quickActions.myOrders')}</h3>
              <p className="text-xs text-slate-500 mt-1">{t('dashboard.quickActions.myOrdersDesc')}</p>
            </Link>
            <Link to="/client-dashboard/favorites" className="bg-[#1b1e2a] rounded-xl p-4 border border-slate-800/50 hover:border-[#5eead4]/30 transition-colors group">
              <div className="w-10 h-10 bg-[#3b181a] rounded-lg flex items-center justify-center text-[#fda4af] mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <h3 className="text-white text-sm font-medium group-hover:text-[#5eead4] transition-colors">{t('dashboard.quickActions.favorites')}</h3>
              <p className="text-xs text-slate-500 mt-1">{t('dashboard.quickActions.favoritesDesc')}</p>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#161821] rounded-2xl shadow-lg border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">{t('dashboard.recentActivity')}</h3>
              <Link to="/client-dashboard/orders" className="text-xs text-slate-400 hover:text-[#5eead4] transition-colors">{t('common.viewAll')}</Link>
            </div>
            {loading ? (
              <div className="text-center py-6 text-slate-500">{t('common.loading')}</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm">{t('dashboard.noOrders')}</p>
                <Link to="/cars" className="text-[#5eead4] hover:underline text-sm mt-1 inline-block">{t('dashboard.quickActions.browseCars')}</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => {
                  const orderStatus = order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending';
                  const isCompleted = ['Completed', 'Approved', 'Accepted'].includes(orderStatus);
                  return (
                    <div key={order.id} className="flex items-center gap-4 p-3 bg-[#1a1c26] rounded-xl hover:bg-slate-800/40 transition-colors">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                        <img src={order.car?.image_url || order.car?.main_image || order.car?.image || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=100&h=100&fit=crop'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-medium truncate">{order.car?.brand} {order.car?.model}</h4>
                        <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-lg ${isCompleted ? 'bg-[#1b3d39] text-[#6ee7b7]' : 'bg-[#40301a] text-[#fbbf24]'}`}>
                        {orderStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Area: Notifications */}
        <div className="xl:col-span-1 border border-slate-800 bg-[#161821] rounded-2xl shadow-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-white">{t('dashboard.messagesFromAdmin')}</h3>
              {unreadMessages > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#5eead4] text-[#11131a] text-[10px] font-bold flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </div>
            <Link to="/client-dashboard/contact" className="text-xs text-slate-400 hover:text-white transition-colors">{t('common.viewAll')}</Link>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 space-y-6">
            {loading ? (
              <div className="text-center text-slate-500 text-sm py-4">{t('dashboard.loadingMessages')}</div>
            ) : adminMessages.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-4">{t('dashboard.noMessages')}</div>
            ) : (
              adminMessages.slice(0, 5).map((msg) => (
                <Link key={msg.id} to="/client-dashboard/contact" className="relative block">
                  <div className="flex gap-4 hover:bg-slate-800/30 p-2 -mx-2 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#213f3b] text-[#5eead4] shrink-0 shadow-sm border border-[#2a4d47]/50 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div className="flex-1 pt-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-0.5">
                        <h4 className="text-sm font-semibold text-white truncate">{msg.sender_name || 'Admin'}</h4>
                        {!msg.is_read && (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#1b3d39] text-[#6ee7b7] shrink-0">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{new Date(msg.created_at).toLocaleDateString()}</p>
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-emerald-500"></div>
                        <div className="min-w-0">
                          {msg.subject && (
                            <p className="text-xs text-slate-400 font-medium truncate mb-1">{msg.subject}</p>
                          )}
                          <p className="text-sm text-slate-300 leading-snug line-clamp-3">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div> {/* End Bottom Row */}
    </div>
  );
};

export default DashboardHome;
