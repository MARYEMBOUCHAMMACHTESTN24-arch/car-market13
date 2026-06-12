import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { settingsAPI } from '../services/api';
import { motion } from 'framer-motion';

const Icons = {
  settings: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  upload: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  globe: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2a2.5 2.5 0 002.5-2.5V14a2 2 0 00-2-2h-.5a2 2 0 00-2-2v-1.5a3 3 0 00-3-3m-1.405 8.68a3.748 3.748 0 013.298-2.9M3.055 11L3 12a9 9 0 00.831 3.737L5 19a9.001 9.001 0 0014.187.355l1.077-1.077A9.001 9.001 0 0021 12l-.055-1m-18.06 0a9.04 9.04 0 012.3-5.263l1.83-1.83A9.001 9.001 0 0121 11H19a2 2 0 00-2 2v1a2 2 0 00-2 2v3.13" /></svg>,
  mail: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
};

const Settings = ({ showToast }) => {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState({
    app_name: '',
    app_logo: '',
    contact_email: '',
    contact_phone: '',
    currency: 'MAD',
    location: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isRtl = i18n.language?.startsWith('ar');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsAPI.getAll();
      if (res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
        if (res.data.app_logo) {
          setLogoPreview(res.data.app_logo);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      showToast?.(t('admin.settings_load_fail') || 'Failed to load settings configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(settings).forEach(key => {
        if (key !== 'app_logo') {
          formData.append(key, settings[key] === null ? '' : settings[key]);
        }
      });
      if (logoFile) {
        formData.append('app_logo', logoFile);
      }

      const res = await settingsAPI.update(formData);
      showToast?.(t('admin.settings_save_success') || 'Global preferences saved successfully!');
      if (res.data?.settings?.app_logo) {
        setLogoPreview(res.data.settings.app_logo);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      showToast?.(err.response?.data?.message || t('admin.settings_save_fail') || 'Failed to update system settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`}></div>
  );

  if (loading) {
    return (
      <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className={`flex justify-between items-end ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
        </div>
        <div className="bg-[#111827] rounded-[24px] border border-white/5 p-8 space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 gap-8">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h1 className={`text-3xl font-bold text-white tracking-tight flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="text-red-500">{Icons.settings}</span>
            {t('admin.settings_title') || 'System Settings'}
          </h1>
          <p className="text-slate-500 mt-1">{t('admin.settings_subtitle') || 'Configure global application branding, contact endpoints, and currency standards.'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Marketplace Branding */}
        <div className="bg-[#111827] rounded-[24px] border border-white/5 shadow-xl overflow-hidden">
          <div className={`px-8 py-6 border-b border-white/5 bg-white/[0.01] flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="text-slate-500">{Icons.globe}</span>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider text-sm">{t('admin.settings_general') || 'General Shop Configuration'}</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div>
                <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.settings_app_name') || 'Platform Application Title'}</label>
                <input
                  type="text"
                  name="app_name"
                  value={settings.app_name}
                  onChange={handleChange}
                  placeholder="e.g. AutoMarket Luxury"
                  className={`w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm font-semibold ${isRtl ? 'text-right' : 'text-left'}`}
                />
              </div>

              {/* Platform Logo Custom Trigger */}
              <div>
                <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.settings_brand_emblem') || 'Platform Brand Emblem'}</label>
                <div className={`flex items-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="w-20 h-20 bg-[#0B0F19] rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative group">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Emblem" className="w-full h-full object-contain p-2" />
                    ) : (
                      <span className="text-slate-600">{Icons.upload}</span>
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p className="text-xs font-bold text-white uppercase tracking-wide">{t('admin.settings_update_emblem') || 'Update Emblem'}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{t('admin.settings_emblem_desc') || 'Square size (PNG, WEBP, or SVG) is recommended.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Endpoint Matrices */}
        <div className="bg-[#111827] rounded-[24px] border border-white/5 shadow-xl overflow-hidden">
          <div className={`px-8 py-6 border-b border-white/5 bg-white/[0.01] flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="text-slate-500">{Icons.mail}</span>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider text-sm">{t('admin.settings_comms') || 'Communication Endpoints'}</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.settings_helpline') || 'Support Helpline Email Address'}</label>
              <input
                type="email"
                name="contact_email"
                value={settings.contact_email}
                onChange={handleChange}
                placeholder="support@automarket.com"
                className={`w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm font-semibold ${isRtl ? 'text-right' : 'text-left'}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.settings_hotline') || 'Support Contact Hotline'}</label>
              <input
                type="text"
                name="contact_phone"
                value={settings.contact_phone}
                onChange={handleChange}
                placeholder="+212 (522) 123-456"
                className={`w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm font-semibold ${isRtl ? 'text-right' : 'text-left'}`}
              />
            </div>
          </div>
        </div>

        {/* Regional Market Rules */}
        <div className="bg-[#111827] rounded-[24px] border border-white/5 shadow-xl overflow-hidden">
          <div className={`px-8 py-6 border-b border-white/5 bg-white/[0.01] flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider text-sm">{t('admin.settings_market') || 'Regional & Market Rules'}</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.settings_currency') || 'Primary Market Currency'}</label>
              <select
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm font-semibold ${isRtl ? 'text-right' : 'text-left'}`}
              >
                <option value="MAD">MAD (DH)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t('admin.settings_showroom') || 'Primary Showroom Headquarters'}</label>
              <input
                type="text"
                name="location"
                value={settings.location}
                onChange={handleChange}
                placeholder="e.g. Casablanca, Morocco"
                className={`w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm font-semibold ${isRtl ? 'text-right' : 'text-left'}`}
              />
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className={`flex gap-3 pt-4 ${isRtl ? 'justify-start' : 'justify-end'}`}>
          <button
            type="button"
            onClick={fetchSettings}
            className="px-6 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 uppercase tracking-widest transition-all"
          >
            {t('admin.settings_discard') || 'Discard'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 disabled:opacity-75 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {t('admin.settings_saving') || 'Saving...'}
              </>
            ) : (
              t('admin.settings_save') || 'Save Global Preferences'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Settings;


