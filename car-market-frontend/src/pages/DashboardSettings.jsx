import React from 'react';
import { useTranslation } from 'react-i18next';

const DashboardSettings = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-wide">{t('dashboard.accountSettings')}</h1>
      </div>

      <div className="bg-[#161821] rounded-2xl border border-slate-800 shadow-lg p-8 divide-y divide-slate-800">
        <div className="pb-8">
          <h3 className="text-lg font-medium text-white mb-6">{t('dashboard.generalPreferences')}</h3>
          <div className="space-y-6 text-slate-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('dashboard.emailNotifications')}</p>
                <p className="text-xs text-slate-500">{t('dashboard.emailNotificationsDesc')}</p>
              </div>
              <div className="w-12 h-6 bg-[#1b3d39] rounded-full relative cursor-pointer border border-[#2a5953]">
                <div className="absolute right-1 top-1 w-4 h-4 bg-[#6ee7b7] rounded-full transition-all"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('dashboard.marketingEmails')}</p>
                <p className="text-xs text-slate-500">{t('dashboard.marketingEmailsDesc')}</p>
              </div>
              <div className="w-12 h-6 bg-slate-800 rounded-full relative cursor-pointer border border-slate-700">
                <div className="absolute left-1 top-1 w-4 h-4 bg-slate-500 rounded-full transition-all"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-8">
          <h3 className="text-lg font-medium text-white mb-6">{t('dashboard.security')}</h3>
          <div className="space-y-4">
            <button className="px-4 py-2 bg-[#1b1e2a] hover:bg-slate-800 text-sm font-medium text-slate-200 border border-slate-800 transition-colors rounded-lg">
              {t('dashboard.changePassword')}
            </button>
            <button className="px-4 py-2 bg-[#1b1e2a] hover:bg-slate-800 text-sm font-medium text-slate-200 border border-slate-800 transition-colors rounded-lg ml-4">
              {t('dashboard.twoFactor')}
            </button>
          </div>
        </div>

        <div className="pt-8">
          <h3 className="text-lg font-medium text-rose-500 mb-6">{t('dashboard.dangerZone')}</h3>
          <button className="px-4 py-2 bg-rose-950/30 hover:bg-rose-900/40 text-sm font-medium text-rose-500 border border-rose-900/50 transition-colors rounded-lg">
            {t('dashboard.deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettings;
