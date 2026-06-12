import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminsAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Icons = {
  plus: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>,
  edit: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  trash: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  shield: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
};

const Admins = ({ showToast }) => {
  const { t, i18n } = useTranslation();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    permissions: []
  });
  const [allPermissions, setAllPermissions] = useState([]);
  const [error, setError] = useState(null);

    // Define modules and their exact required permissions for UI grouping
    const permissionGroups = [
      { key: 'perm_group_dashboard',    title: 'Dashboard',         permissions: ['view_dashboard'] },
      { key: 'perm_group_admins',       title: 'Admins & Access',   permissions: ['admins.view', 'admins.create', 'admins.edit', 'admins.delete'] },
      { key: 'perm_group_cars',         title: 'Cars',              permissions: ['view_cars', 'manage_cars'] },
      { key: 'perm_group_categories',   title: 'Categories',        permissions: ['view_categories', 'manage_categories'] },
      { key: 'perm_group_orders',       title: 'Orders',            permissions: ['view_orders', 'manage_orders'] },
      { key: 'perm_group_offers',       title: 'Offers',            permissions: ['view_offers', 'manage_offers'] },
      { key: 'perm_group_users',        title: 'Users',             permissions: ['view_users', 'manage_users'] },
      { key: 'perm_group_messages',     title: 'Messages',          permissions: ['view_messages', 'manage_messages'] },
      { key: 'perm_group_notif',        title: 'Notifications',     permissions: ['view_notifications'] },
      { key: 'perm_group_ai',           title: 'AI Analytics',      permissions: ['view_ai_analytics'] },
      { key: 'perm_group_bi',           title: 'BI Analytics',      permissions: ['view_bi_dashboard', 'view_revenue'] },
      { key: 'perm_group_settings',     title: 'Settings',          permissions: ['view_settings', 'manage_settings'] }
    ];

  const isRtl = i18n.language?.startsWith('ar');

  useEffect(() => {
    fetchAdmins();
    fetchAllPermissions();
  }, []);

  const fetchAllPermissions = async () => {
    try {
      const res = await adminsAPI.getPermissions();
      setAllPermissions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await adminsAPI.getAll();
      setAdmins(res.data || []);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
      showToast?.(t('admin.admins_fetch_error') || 'Error listing admins', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingAdmin(null);
    setFormData({ name: '', email: '', password: '', role: 'admin', permissions: [] });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      role: admin.roles?.[0]?.name || admin.role || 'admin',
      permissions: admin.permissions?.map(p => p.name) || []
    });
    setError(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.admins_confirm_delete') || 'Are you sure you want to delete this admin account?')) return;
    try {
      await adminsAPI.delete(id);
      setAdmins(prev => prev.filter(a => a.id !== id));
      showToast?.(t('admin.admins_delete_success') || 'Admin deleted successfully');
    } catch (err) {
      showToast?.(err.response?.data?.message || t('admin.admins_delete_failed') || 'Failed to delete admin', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingAdmin) {
        const res = await adminsAPI.update(editingAdmin.id, formData);
        setAdmins(prev => prev.map(a => a.id === editingAdmin.id ? res.data : a));
        showToast?.(t('admin.admins_update_success') || 'Admin updated successfully');
      } else {
        const res = await adminsAPI.create(formData);
        setAdmins(prev => [...prev, res.data]);
        showToast?.(t('admin.admins_create_success') || 'Admin created successfully');
      }
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || t('admin.admins_validation_failed') || 'Validation failed. Please verify input fields.');
    }
  };

  const handlePermissionToggle = (permName) => {
    setFormData(prev => {
      const perms = prev.permissions.includes(permName)
        ? prev.permissions.filter(p => p !== permName)
        : [...prev.permissions, permName];
      return { ...prev, permissions: perms };
    });
  };

  const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`}></div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Area */}
      <div className={`flex items-center justify-between flex-wrap gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('admin.admins_title') || 'Administrative Accounts'}</h1>
          <p className="text-slate-500 mt-1">{t('admin.admins_subtitle') || 'Configure staff, managers, and developer roles with granular permission matrices.'}</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-95"
        >
          {Icons.plus} {t('admin.admins_add') || 'Add New Admin'}
        </button>
      </div>

      {/* Admins Table Container */}
      <div className="bg-[#111827] rounded-[24px] border border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className={`py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'pr-8 pl-6 text-right' : 'pl-8 pr-6 text-left'}`}>{t('admin.admins_table_name') || 'Admin Name'}</th>
                <th className={`px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.admins_form_email') || 'Email Address'}</th>
                <th className={`px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.admins_table_role') || 'System Role'}</th>
                <th className={`px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.admins_table_matrix') || 'Access Permissions'}</th>
                <th className={`py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'text-left pl-8' : 'text-right pr-8'}`}>{t('admin.orders_actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan="5" className="px-8 py-4"><Skeleton className="h-12 w-full" /></td></tr>
                ))
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-slate-500 font-medium">{t('admin.admins_no_accounts') || 'No administrative accounts registered yet.'}</td>
                </tr>
              ) : (
                admins.map((admin, idx) => {
                  const roleName = admin.roles?.[0]?.name || admin.role || 'admin';
                  return (
                    <tr key={admin.id || idx} className="hover:bg-white/[0.02] transition-all group">
                      <td className={`py-5 font-bold text-white text-base group-hover:text-red-500 transition-all ${isRtl ? 'pr-8 pl-6 text-right' : 'pl-8 pr-6 text-left'}`}>
                        {admin.name}
                      </td>
                      <td className={`px-6 py-5 font-medium text-slate-400 ${isRtl ? 'text-right' : 'text-left'}`}>
                        {admin.email}
                      </td>
                      <td className={`px-6 py-5 ${isRtl ? 'text-right' : 'text-left'}`}>
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider border ${roleName === 'manager' ? 'bg-purple-500/10 text-purple-400 border-purple-500/10' : 'bg-red-500/10 text-red-400 border-red-500/10'}`}>
                          {roleName}
                        </span>
                      </td>
                      <td className={`px-6 py-5 ${isRtl ? 'text-right' : 'text-left'}`}>
                        {admin.permissions?.length > 0 ? (
                          <div className={`flex flex-wrap gap-1.5 max-w-sm ${isRtl ? 'justify-start flex-row-reverse' : ''}`}>
                            {admin.permissions.map(p => {
                              const pName = p.name.replace(/_/g, ' ');
                              return (
                                <span key={p.id} className="px-2 py-0.5 bg-white/5 text-slate-400 rounded-md text-[9px] font-bold uppercase tracking-wider border border-white/5">
                                  {pName}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{t('admin.admins_full_privileges') || 'FULL PRIVILEGES (ROOT)'}</span>
                        )}
                      </td>
                      <td className={`py-5 ${isRtl ? 'text-left pl-8' : 'text-right pr-8'}`}>
                        <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all ${isRtl ? 'justify-start -translate-x-2 group-hover:translate-x-0' : 'justify-end translate-x-2 group-hover:translate-x-0'}`}>
                          <button
                            onClick={() => handleOpenEdit(admin)}
                            className="p-2.5 text-slate-400 hover:text-white transition-all hover:bg-[#0B0F19] rounded-xl border border-transparent hover:border-white/10"
                            title={t('admin.orders_update_status') || 'Edit Permissions'}
                          >
                            {Icons.edit}
                          </button>
                          <button
                            onClick={() => handleDelete(admin.id)}
                            className="p-2.5 text-rose-500 hover:text-white transition-all hover:bg-rose-600 rounded-xl border border-rose-500/20 hover:border-rose-600 shadow-sm"
                            title={t('admin.orders_remove') || 'Revoke Admin Access'}
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

      {/* Modal - PHOTO COPY REPLICA ACCENTS */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" dir={isRtl ? 'rtl' : 'ltr'}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] rounded-[24px] border border-white/5 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className={`px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01] ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h3 className={`text-xl font-bold text-white flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-red-500">{Icons.shield}</span>
                  {editingAdmin ? (t('admin.admins_configure') || 'Configure Credentials') : (t('admin.admins_provision') || 'Provision Admin')}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors font-bold text-lg">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                {error && (
                  <div className="bg-rose-600/10 border border-rose-500/20 text-rose-400 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.admins_form_name') || 'Display Name'}</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm ${isRtl ? 'text-right' : 'text-left'}`}
                      placeholder="e.g. Liam Dev"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.admins_form_email') || 'Email Address'}</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm ${isRtl ? 'text-right' : 'text-left'}`}
                      placeholder="e.g. admin@automarket.com"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {editingAdmin ? (t('admin.admins_form_pass_new') || 'New Password (Optional)') : (t('admin.admins_form_pass') || 'Security Password')}
                    </label>
                    <input
                      required={!editingAdmin}
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm ${isRtl ? 'text-right' : 'text-left'}`}
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.admins_level') || 'System Level'}</label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className={`w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm font-semibold ${isRtl ? 'text-right' : 'text-left'}`}
                    >
                      <option value="admin">{t('admin.admins_level_admin') || 'Full Administrator (Root)'}</option>
                      <option value="manager">{t('admin.admins_level_manager') || 'SaaS Operations Manager'}</option>
                    </select>
                  </div>

                  {/* Access Matrices Grouped */}
                  <div>
                    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.admins_permissions_title') || 'Access Matrix Permissions'}</label>
                    <div className="max-h-80 overflow-y-auto border border-white/5 rounded-xl p-5 bg-[#0B0F19] custom-scrollbar space-y-6">
                      {permissionGroups.map(group => {
                        // Filter out permissions that actually exist in the fetched list (to avoid errors)
                        const groupPerms = group.permissions.filter(pName => allPermissions.some(ap => ap.name === pName));
                        
                        if (groupPerms.length === 0) return null;

                        return (
                          <div key={group.title} className="space-y-3">
                            <h4 className={`text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                              {t(`admin.${group.key}`) || group.title}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              {groupPerms.map(pName => {
                                const isChecked = formData.permissions.includes(pName);
                                return (
                                  <div 
                                    key={pName} 
                                    onClick={() => handlePermissionToggle(pName)}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${isChecked ? 'bg-red-500/10 border-red-500/20 text-white' : 'hover:bg-white/5 border-transparent text-slate-400'} ${isRtl ? 'flex-row-reverse' : ''}`}
                                  >
                                    <input 
                                      type="checkbox" 
                                      checked={isChecked}
                                      readOnly
                                      className="rounded border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0 bg-[#0B0F19] w-4 h-4"
                                    />
                                    <span className="text-[11px] font-bold uppercase tracking-wide truncate">
                                      {t(`admin.perm_${pName}`) || pName.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`pt-4 flex items-center gap-3 border-t border-white/5 ${isRtl ? 'justify-start' : 'justify-end'}`}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-5 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 uppercase tracking-widest transition-all"
                    >
                      {t('admin.modal_cancel') || 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
                    >
                      {editingAdmin ? (t('admin.btn_save_changes') || 'Save Changes') : (t('admin.btn_confirm_provision') || 'Confirm Provisioning')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Admins;


