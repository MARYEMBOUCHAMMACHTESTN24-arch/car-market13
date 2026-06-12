import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, facturesAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Icons = {
  search: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  eye: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  calendar: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  bag: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  edit: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  trash: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  document: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
};

const DashboardOrders = ({ user, showToast }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // ── Role guard: only admin / manager may access this component ──────────
  const role = user?.role;
  if (role && role !== 'admin' && role !== 'manager') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 text-sm">You do not have permission to view this page.</p>
      </div>
    );
  }
  // ────────────────────────────────────────────────────────────────────────

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals and Actions
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [formData, setFormData] = useState({
    status: 'pending',
    appointment_date: '',
    appointment_time: '',
    appointment_location: '',
    appointment_note: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll();
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setOrders(data);
      setFilteredOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
      showToast?.('Error loading orders from backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredOrders(orders);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredOrders(orders.filter(o => 
        (o.car?.brand || '').toLowerCase().includes(term) || 
        (o.car?.model || '').toLowerCase().includes(term) ||
        (o.user?.name || '').toLowerCase().includes(term) ||
        (o.name || '').toLowerCase().includes(term)
      ));
    }
  }, [searchTerm, orders]);

  const handleOpenEdit = (order) => {
    setSelectedOrder(order);
    setFormData({
      status: order.status || 'pending',
      appointment_date: order.appointment_date || '',
      appointment_time: order.appointment_time || '',
      appointment_location: order.appointment_location || '',
      appointment_note: order.appointment_note || ''
    });
    setShowEditModal(true);
  };

  const handleOpenView = (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await ordersAPI.update(selectedOrder.id, formData);
      showToast?.('Order transaction status updated successfully.');
      setShowEditModal(false);
      loadOrders();

      // If the admin just approved, navigate to the auto-generated invoice
      if (formData.status === 'approved') {
        // Fetch factures to find the one linked to this order
        try {
          const fRes = await facturesAPI.getAll();
          const factures = Array.isArray(fRes.data) ? fRes.data : (fRes.data?.data || []);
          const linked = factures.find((f) => f.order_id === selectedOrder.id);
          if (linked) {
            navigate(`/invoice/${linked.id}`);
          }
        } catch (fErr) {
          console.warn('Could not fetch invoice after approval:', fErr.message);
        }
      }
    } catch (err) {
      console.error(err);
      showToast?.(err.response?.data?.message || 'Failed to update order status.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('orders.confirm_delete') || 'Are you sure you want to permanently cancel and delete this order?')) return;
    try {
      await ordersAPI.delete(id);
      showToast?.(t('orders.deleted') || 'Order removed from registry.');
      loadOrders();
    } catch (err) {
      console.error(err);
      showToast?.(t('orders.delete_error') || 'Failed to delete order listing', 'error');
    }
  };

  const handleGenerateInvoice = async (orderId) => {
    try {
      showToast?.('Generating invoice...', 'info');
      const response = await facturesAPI.generate(orderId, {});
      showToast?.('Invoice generated successfully!', 'success');
      loadOrders();
      if (response.data && response.data.facture) {
        navigate(`/invoice/${response.data.facture.id}`);
      }
    } catch (err) {
      console.error('Invoice Generation Error:', err.response?.data || err.message);
      showToast?.(err.response?.data?.message || 'Failed to generate invoice. Please check console.', 'error');
    }
  };

  const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`}></div>
  );

  const isRtl = i18n.language?.startsWith('ar');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('admin.sidebar_all_orders')}</h1>
          <p className="text-slate-500 mt-1">{t('admin.orders_subtitle') || 'Review, monitor, and process transactions and orders globally.'}</p>
        </div>
      </div>

      {/* Orders Container */}
      <div className="bg-[#111827] rounded-[24px] border border-white/5 shadow-xl overflow-hidden">
        {/* Controls */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="relative w-full max-w-md group">
            <span className={`absolute top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors ${isRtl ? 'right-4' : 'left-4'}`}>{Icons.search}</span>
            <input 
              type="text" 
              placeholder={t('admin.orders_search') || 'Search orders by vehicle or user...'} 
              className={`w-full py-2.5 bg-[#0B0F19] border border-white/5 rounded-xl text-sm text-white outline-none focus:border-red-500/30 transition-all ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'}`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-xs font-bold text-slate-500 bg-[#0B0F19] border border-white/5 px-4 py-2.5 rounded-xl">
            {loading ? '---' : `${filteredOrders.length} ${t('admin.transactions_count') || 'Transactions'}`}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className={`py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'pr-8 pl-6 text-right' : 'pl-8 pr-6 text-left'}`}>{t('admin.table_car')}</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.table_date') || 'Date'}</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.table_price')}</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.table_status')}</th>
                <th className={`py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'text-left pl-8' : 'text-right pr-8'}`}>{t('admin.table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan="5" className="px-8 py-4"><Skeleton className="h-12 w-full" /></td></tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center gap-3 py-6">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400">
                        {Icons.bag}
                      </div>
                      <p>{t('orders.no_orders') || 'No orders registered in the system database.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const rawStatus = order.status || 'pending';
                  const orderStatus = t(`orders.status_${rawStatus}`) || rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
                  const isCompleted = ['completed', 'approved', 'accepted'].includes(rawStatus.toLowerCase());
                  const isPending = rawStatus.toLowerCase() === 'pending';
                  const isCanceled = ['canceled', 'cancelled', 'rejected'].includes(rawStatus.toLowerCase());

                  return (
                    <tr key={order.id || idx} className="hover:bg-white/[0.02] transition-all group">
                      <td className={`py-5 ${isRtl ? 'pr-8 pl-6' : 'pl-8 pr-6'}`}>
                        <div className="flex items-center gap-4">
                          <img
                            src={order.car?.image_url || order.car?.main_image || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=300&h=200&fit=crop'}
                            alt=""
                            className="w-14 h-10 rounded-lg object-cover border border-white/10 group-hover:border-red-500/30 transition-all shadow-lg"
                          />
                          <div>
                            <span className="font-bold text-white group-hover:text-red-500 transition-all block text-base leading-tight">{order.car?.brand} {order.car?.model}</span>
                            <span className="text-[10px] text-slate-500 mt-1 block">{t('orders.ordered_by') || 'Ordered by'} {order.name || order.user?.name || 'Customer'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-semibold text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">{Icons.calendar}</span>
                          <span>{new Date(order.created_at).toLocaleDateString(i18n.language?.startsWith('ar') ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-mono font-bold text-white text-lg">
                        {order.car?.price?.toLocaleString() || '0'} <span className="text-[10px] text-slate-500 font-sans ml-0.5">DH</span>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border
                          ${isCompleted ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500/10' : ''}
                          ${isPending ? 'bg-amber-600/10 text-amber-500 border-amber-500/10' : ''}
                          ${isCanceled ? 'bg-rose-600/10 text-rose-500 border-rose-500/10' : ''}
                        `}
                        >
                          {orderStatus}
                        </span>
                      </td>
                      <td className={`py-5 ${isRtl ? 'text-left pl-8' : 'text-right pr-8'}`}>
                        <div className={`flex items-center gap-2 transition-all ${isRtl ? 'justify-start' : 'justify-end'}`}>
                          <button
                            onClick={() => handleGenerateInvoice(order.id)}
                            className="p-2.5 text-blue-500 hover:text-white transition-all hover:bg-blue-600 rounded-xl border border-blue-500/20 hover:border-blue-600 shadow-sm"
                            title="Validate & Generate Invoice"
                          >
                            {Icons.document}
                          </button>
                          <button
                            onClick={() => handleOpenView(order)}
                            className="p-2.5 text-slate-400 hover:text-white transition-all hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"
                            title={t('orders.view_details') || 'View Details'}
                          >
                            {Icons.eye}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(order)}
                            className="p-2.5 text-red-500 hover:text-white transition-all hover:bg-red-600 rounded-xl border border-red-500/20 hover:border-red-600 shadow-sm"
                            title={t('orders.update_status') || 'Update Status'}
                          >
                            {Icons.edit}
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="p-2.5 text-rose-500 hover:text-white transition-all hover:bg-rose-600 rounded-xl border border-rose-500/20 hover:border-rose-600 shadow-sm"
                            title={t('orders.delete_title') || 'Delete Order'}
                          >
                            {Icons.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Order Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] rounded-[24px] border border-white/5 shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <span className="text-red-500">{Icons.bag}</span>
                  {t('orders.manage_transaction') || 'Manage Customer Transaction'}
                </h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white transition-colors font-bold text-lg">✕</button>
              </div>

              <div className="p-8 space-y-6">
                <form onSubmit={handleStatusUpdate} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('orders.action_status') || 'Order Action Status'}</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm font-semibold"
                    >
                      <option value="pending">{t('orders.status_pending') || 'Pending Review'}</option>
                      <option value="approved">{t('orders.status_approved_schedule') || 'Approved & Schedule Appointment'}</option>
                      <option value="rejected">{t('orders.status_rejected') || 'Rejected / Denied'}</option>
                      <option value="cancelled">{t('orders.status_cancelled') || 'Cancelled'}</option>
                    </select>
                  </div>

                  {formData.status === 'approved' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('orders.appt_date') || 'Appointment Date'}</label>
                          <input
                            type="date"
                            value={formData.appointment_date}
                            onChange={e => setFormData({ ...formData, appointment_date: e.target.value })}
                            className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('orders.appt_time') || 'Appointment Time'}</label>
                          <input
                            type="text"
                            value={formData.appointment_time}
                            onChange={e => setFormData({ ...formData, appointment_time: e.target.value })}
                            className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm font-semibold"
                            placeholder="e.g. 14:00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('orders.appt_location') || 'Showroom Location'}</label>
                        <input
                          type="text"
                          value={formData.appointment_location}
                          onChange={e => setFormData({ ...formData, appointment_location: e.target.value })}
                          className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm font-semibold"
                          placeholder="e.g. Casablanca HQ"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('orders.appt_note') || 'Instructions Note'}</label>
                        <textarea
                          value={formData.appointment_note}
                          onChange={e => setFormData({ ...formData, appointment_note: e.target.value })}
                          className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm h-20 resize-none font-semibold"
                          placeholder="Add directions, phone contact notes..."
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="pt-6 border-t border-white/5 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-5 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 uppercase tracking-widest transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
                    >
                      {saving ? t('common.loading') : t('admin.save_changes')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Order Modal */}
      <AnimatePresence>
        {showViewModal && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] rounded-[24px] border border-white/5 shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <span className="text-red-500">{Icons.eye}</span>
                  {t('orders.details_profile') || 'Transaction Details Profile'}
                </h3>
                <button onClick={() => setShowViewModal(false)} className="text-slate-500 hover:text-white transition-colors font-bold text-lg">✕</button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-8 items-start">
                  {/* Left Column: Car specs */}
                  <div className="space-y-4 bg-[#0B0F19] border border-white/5 p-5 rounded-2xl">
                    <img 
                      src={selectedOrder.car?.image_url || selectedOrder.car?.main_image || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=300&h=200&fit=crop'} 
                      alt="" 
                      className="w-full h-32 object-cover rounded-xl border border-white/10" 
                    />
                    <div>
                      <h4 className="text-lg font-bold text-white">{selectedOrder.car?.brand} {selectedOrder.car?.model}</h4>
                      <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">{selectedOrder.car?.category || 'Sedan'} Class Listing</p>
                      <p className="text-xl font-mono font-bold text-red-500 mt-3">{selectedOrder.car?.price?.toLocaleString()} DH</p>
                    </div>
                  </div>

                  {/* Right Column: Customer info */}
                  <div className="space-y-5">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('orders.purchaser_info') || 'Purchaser Information'}</span>
                      <p className="text-base font-bold text-white">{selectedOrder.name || selectedOrder.user?.name || 'Customer'}</p>
                      <p className="text-xs font-semibold text-slate-400 mt-1">{selectedOrder.email || selectedOrder.user?.email || 'N/A'}</p>
                      <p className="text-xs font-semibold text-slate-400 mt-1">{selectedOrder.phone || 'N/A'}</p>
                    </div>

                    <div className="border-t border-white/5 pt-4">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('orders.registry_specs') || 'Registry Specifications'}</span>
                      <p className="text-xs font-semibold text-slate-400">Order ID: <span className="font-mono text-white font-bold ml-1">TRN-{selectedOrder.id?.toString().padStart(4, '0')}</span></p>
                      <p className="text-xs font-semibold text-slate-400 mt-1.5">Submitted On: <span className="text-white font-semibold ml-1">{new Date(selectedOrder.created_at).toLocaleString()}</span></p>
                    </div>

                    {selectedOrder.status === 'approved' && selectedOrder.appointment_date && (
                      <div className="border-t border-red-500/10 pt-4 bg-red-500/[0.02] p-4 rounded-xl border border-red-500/10">
                        <span className="block text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">{t('orders.showroom_handover') || 'Scheduled Showroom Handover'}</span>
                        <p className="text-xs font-bold text-white">Date: <span className="font-mono ml-1 font-semibold text-slate-300">{selectedOrder.appointment_date} @ {selectedOrder.appointment_time || 'N/A'}</span></p>
                        <p className="text-xs font-bold text-white mt-1">HQ Location: <span className="ml-1 text-slate-300 font-semibold">{selectedOrder.appointment_location || 'Casablanca'}</span></p>
                        {selectedOrder.appointment_note && <p className="text-[10px] text-slate-500 italic mt-2 leading-relaxed">"{selectedOrder.appointment_note}"</p>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowViewModal(false)}
                    className="px-6 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 uppercase tracking-widest transition-all"
                  >
                    {t('common.close') || 'Close Profile'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DashboardOrders;


