import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import UserAvatar, { getUserAvatarSrc } from '../components/UserAvatar';

const DashboardEditProfile = ({ user, updateUser }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState(getUserAvatarSrc(user));
  const [profileImageFile, setProfileImageFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      setProfileImageFile(file);
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      if (profileImageFile) {
        payload.append('profile_image', profileImageFile);
      }

      const response = await authAPI.updateProfile(payload);
      const updatedUser = response.data?.user || { ...user, ...formData };
      updateUser(updatedUser);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/client-dashboard/profile');
      }, 1500);
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/client-dashboard/profile')}
          className="p-2 rounded-lg bg-[#161821] border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-semibold text-white tracking-wide">{t('dashboard.editProfile')}</h1>
      </div>

      <div className="bg-[#161821] rounded-2xl border border-slate-800 shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl text-rose-500 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-emerald-500 text-sm">
              {t('dashboard.profileSuccess')}
            </div>
          )}

          <div className="flex flex-col items-center mb-8">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
            <div 
              className="relative group cursor-pointer"
              onClick={handleImageClick}
            >
              <UserAvatar
                user={user}
                src={imagePreview}
                alt="Avatar"
                sizeClass="w-24 h-24"
                roundedClass="rounded-2xl"
                textClass="text-3xl"
                className="border-4 border-slate-800 shadow-xl group-hover:opacity-75 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 font-medium">{t('dashboard.changePhoto')}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">{t('register.nameLabel')}</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-[#1b1e2a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5eead4]/50 focus:ring-1 focus:ring-[#5eead4]/50 transition-colors"
                placeholder={t('register.namePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">{t('register.emailLabel')}</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-[#1b1e2a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5eead4]/50 focus:ring-1 focus:ring-[#5eead4]/50 transition-colors"
                placeholder={t('register.emailPlaceholder')}
              />
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button 
              type="button"
              onClick={() => navigate('/client-dashboard/profile')}
              className="flex-1 px-6 py-3 bg-[#1e202d] hover:bg-slate-800 text-slate-300 border border-slate-700/50 rounded-xl text-sm font-medium transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#1b3d39] hover:bg-[#214b46] text-[#6ee7b7] border border-[#2a5953] rounded-xl text-sm font-medium transition-colors shadow-lg shadow-emerald-950/20 disabled:opacity-50"
            >
              {loading ? t('dashboard.saving') : t('dashboard.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DashboardEditProfile;
