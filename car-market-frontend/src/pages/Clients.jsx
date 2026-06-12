import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usersAPI } from '../services/api';

const Icons = {
  search: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  users: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  mail: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  calendar: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
};

const Clients = ({ showToast }) => {
  const { t, i18n } = useTranslation();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const res = await usersAPI.getAll(); 
        const clientUsers = Array.isArray(res.data) 
          ? res.data.filter(u => u.role === 'client' || u.role === 'user') 
          : [];
        setClients(clientUsers);
        setFilteredClients(clientUsers);
      } catch (err) {
        console.error(err);
        showToast?.(t('admin.users_fetch_error') || 'Failed to fetch clients list', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [showToast, t]);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredClients(clients);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredClients(clients.filter(c => 
        (c.name || '').toLowerCase().includes(term) || 
        (c.email || '').toLowerCase().includes(term)
      ));
    }
  }, [searchTerm, clients]);

  const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`}></div>
  );

  const isRtl = i18n.language?.startsWith('ar');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('admin.users_title') || 'User Directory'}</h1>
          <p className="text-slate-500 mt-1">{t('admin.users_subtitle') || 'Manage, search, and view registered marketplace clients and users.'}</p>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-[#111827] rounded-[24px] border border-white/5 shadow-xl overflow-hidden">
        {/* Controls */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="relative w-full max-w-md group">
            <span className={`absolute top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors ${isRtl ? 'right-4' : 'left-4'}`}>{Icons.search}</span>
            <input 
              type="text" 
              placeholder={t('admin.users_search') || 'Search clients by name or email...'} 
              className={`w-full py-2.5 bg-[#0B0F19] border border-white/5 rounded-xl text-sm text-white outline-none focus:border-red-500/30 transition-all ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'}`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-xs font-bold text-slate-500 bg-[#0B0F19] border border-white/5 px-4 py-2.5 rounded-xl">
            {loading ? '---' : `${filteredClients.length} ${t('admin.users_registered') || 'Registered'}`}
          </span>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className={`py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'pr-8 pl-6 text-right' : 'pl-8 pr-6 text-left'}`}>{t('admin.users_table_user') || 'Client Name'}</th>
                <th className={`px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.users_table_contact') || 'Email Address'}</th>
                <th className={`px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.users_table_role') || 'Role'}</th>
                <th className={`px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.users_table_joined') || 'Joined Date'}</th>
                <th className={`py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'text-left pl-8' : 'text-right pr-8'}`}>{t('admin.sidebar_transactions') || 'Transactions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan="5" className="px-8 py-4"><Skeleton className="h-12 w-full" /></td></tr>
                ))
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-slate-500 font-medium">
                    {t('admin.users_no_results') || 'No clients found matching your search term.'}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, idx) => (
                  <tr key={client.id || idx} className="hover:bg-white/[0.02] transition-all group">
                    <td className={`py-5 ${isRtl ? 'pr-8 pl-6' : 'pl-8 pr-6'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/10 flex items-center justify-center font-bold text-sm">
                          {(client.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-white group-hover:text-red-500 transition-all text-base">{client.name}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-5 font-medium text-slate-400 ${isRtl ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">{Icons.mail}</span>
                        <span>{client.email}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-5 ${isRtl ? 'text-right' : 'text-left'}`}>
                      <span className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider border ${client.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/10' : 'bg-red-500/10 text-red-500 border-red-500/10'}`}>
                        {client.role || 'client'}
                      </span>
                    </td>
                    <td className={`px-6 py-5 font-semibold text-slate-500 ${isRtl ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">{Icons.calendar}</span>
                        <span>{client.created_at ? new Date(client.created_at).toLocaleDateString(i18n.language?.startsWith('ar') ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '---'}</span>
                      </div>
                    </td>
                    <td className={`py-5 ${isRtl ? 'text-left pl-8' : 'text-right pr-8'}`}>
                      {client.orders_count || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default Clients;


