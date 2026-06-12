import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read token and email from query string: /reset-password?token=...&email=...
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  console.log('[ResetPassword] URL:', window.location.href);
  console.log('[ResetPassword] token:', token);
  console.log('[ResetPassword] email:', email);

  const [form, setForm] = useState({
    token,
    email,
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const missingToken = !token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.password_confirmation) {
      setError(t('register.passwordMismatch') || 'Passwords do not match.');
      return;
    }

    if (form.password.length < 8) {
      setError(t('register.passwordMinLength') || 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || t('resetPassword.errorMessage') || 'Failed to reset password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-28 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">{t('resetPassword.successTitle') || 'Password Reset!'}</h1>
            <p className="text-gray-500 mb-2">{t('resetPassword.successMessage') || 'Your password has been updated successfully.'}</p>
            <p className="text-gray-400 text-sm mb-6">Redirecting you to login...</p>
            <Link to="/login" className="block w-full btn-primary !py-3.5 text-base">
              {t('forgotPassword.backToLogin') || 'Back to Login'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-28 pb-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center">
            <img src="/logo/logo-horizontal.svg" alt="AutoMarket Logo" className="h-10" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black font-heading text-gray-900 mb-3">{t('resetPassword.title') || 'Set New Password'}</h1>
            <p className="text-gray-500 text-sm">
              {t('resetPassword.subtitle') || 'Enter your new password below.'}
            </p>
          </div>

          {missingToken && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-4 rounded-xl text-sm mb-6">
              <p className="font-semibold mb-1">Invalid reset link</p>
              <p>This link is missing a reset token. Please request a new password reset link.</p>
              <Link to="/forgot-password" className="mt-3 block text-center text-red-600 hover:underline font-semibold">
                Request New Reset Link →
              </Link>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('register.emailLabel') || 'Email Address'}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={!!email}
                className="input-field disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                placeholder={t('register.emailPlaceholder') || 'your@email.com'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('resetPassword.newPassword') || 'New Password'}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                disabled={missingToken}
                className="input-field"
                placeholder={t('resetPassword.newPasswordPlaceholder') || 'Min. 8 characters'}
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('register.confirmPasswordLabel') || 'Confirm New Password'}</label>
              <input
                type="password"
                value={form.password_confirmation}
                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                required
                disabled={missingToken}
                className="input-field"
                placeholder={t('resetPassword.newPasswordPlaceholder') || 'Repeat new password'}
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={loading || missingToken}
              className="w-full btn-primary !py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  {t('resetPassword.resetting') || 'Resetting...'}
                </span>
              ) : (t('resetPassword.title') || 'Reset Password')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-red-600 transition-colors">
              {t('forgotPassword.backToLogin') || '← Back to Login'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;


