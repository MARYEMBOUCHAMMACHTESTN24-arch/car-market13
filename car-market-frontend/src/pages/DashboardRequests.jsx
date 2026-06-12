import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ordersAPI } from '../services/api';

const DashboardRequests = ({ user }) => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await ordersAPI.getAll().catch(() => ({ data: [] }));
        if (response && response.data) {
          // Filter for pending status
          const pendingRequests = response.data.filter(order => order.status === 'pending');
          setRequests(pendingRequests);
        }
      } catch (err) {
        console.error('Failed to fetch requests', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchRequests();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white tracking-wide">{t('dashboard.sidebar.myRequests')}</h1>
        <Link
          to="/cars"
          className="flex items-center gap-2 bg-[#1b3d39] hover:bg-[#214b46] text-[#6ee7b7] px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-[#2a5953] shadow-md"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('common.newOrder')}
        </Link>
      </div>

      <div className="bg-[#161821] rounded-2xl shadow-lg border border-slate-800 px-1 pb-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500 font-medium">
              <th className="px-5 py-4 font-normal">{t('orders.car')}</th>
              <th className="px-5 py-4 font-normal">{t('orders.date')}</th>
              <th className="px-5 py-4 font-normal">{t('orders.status')}</th>
              <th className="px-5 py-4 font-normal">{t('orders.actions')}</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-6 text-slate-500">{t('orders.loading')}</td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-12 text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <p>{t('dashboard.noRequests')}</p>
                    <Link to="/cars" className="text-[#5eead4] hover:underline text-sm mt-1">{t('orders.browseCars')}</Link>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map((request, idx) => (
                <tr
                  key={request.id}
                  className={`${idx !== requests.length - 1 ? 'border-b border-slate-800/60' : ''} bg-[#1a1c26] hover:bg-slate-800/40 transition-colors m-2 group`}
                >
                  <td className="px-5 py-3.5 first:rounded-l-xl">
                    <Link to={`/car/${request.car_id}`} className="flex items-center gap-4">
                      <div className="w-20 h-10 rounded shadow-md overflow-hidden bg-slate-800 border border-slate-700/30 shrink-0">
                        <img
                          src={request.car?.image_url || request.car?.main_image || request.car?.image || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=300&h=200&fit=crop'}
                          alt={request.car?.brand}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm leading-tight group-hover:text-[#5eead4] transition-colors">
                          {request.car?.brand} {request.car?.model}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">{request.car?.year}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-sm whitespace-nowrap">
                    {new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#40301a] text-[#fcd34d] border border-[#5f4423]/50">
                      {request.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 last:rounded-r-xl">
                    <Link
                      to={`/car/${request.car_id}`}
                      className="text-xs text-slate-400 hover:text-[#5eead4] transition-colors"
                    >
                      {t('common.viewCar')}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardRequests;
