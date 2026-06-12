import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UserAvatar from '../components/UserAvatar';

const DashboardProfile = ({ user }) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-wide">{t('dashboard.myProfile')}</h1>
      </div>

      <div className="bg-[#161821] rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
        {/* Profile Header */}
        <div className="h-32 bg-gradient-to-r from-[#213f3b] to-[#1a2d2a] border-b border-slate-700/30"></div>
        
        <div className="px-8 pb-8">
          <div className="relative -mt-12 mb-6 flex items-end gap-6">
            <UserAvatar
              user={user}
              alt="Profile"
              sizeClass="w-24 h-24"
              roundedClass="rounded-2xl"
              textClass="text-3xl"
              className="border-4 border-[#161821] shadow-xl"
            />
            <div className="pb-1">
              <h2 className="text-xl font-bold text-white">{user?.name || 'Ahmed'}</h2>
              <p className="text-slate-400 text-sm">{user?.email || 'ahmed@example.com'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-800/50">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">{t('dashboard.personalInfo')}</h3>
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t('register.nameLabel')}</label>
                <div className="text-sm font-medium text-slate-200 bg-[#1b1e2a] px-4 py-2.5 rounded-lg border border-slate-800/50">
                  {user?.name || 'Ahmed'}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t('register.emailLabel')}</label>
                <div className="text-sm font-medium text-slate-200 bg-[#1b1e2a] px-4 py-2.5 rounded-lg border border-slate-800/50">
                  {user?.email || 'ahmed@example.com'}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">{t('dashboard.accountStatus')}</h3>
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t('dashboard.role')}</label>
                <span className="inline-flex px-3 py-1 bg-[#1b3d39] text-[#6ee7b7] text-xs font-semibold rounded-lg border border-[#2a5953]/50">
                  {user?.role || 'Client'}
                </span>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t('dashboard.memberSince')}</label>
                <div className="text-sm font-medium text-slate-400 uppercase">
                  April 2024
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-10 flex justify-end">
            <Link 
              to="/client-dashboard/edit-profile"
              className="px-6 py-2.5 bg-[#1b3d39] hover:bg-[#214b46] text-[#6ee7b7] border border-[#2a5953] rounded-xl text-sm font-medium transition-colors inline-block"
            >
              {t('dashboard.editProfile')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardProfile;
