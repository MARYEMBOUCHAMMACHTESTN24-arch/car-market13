import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = ({ user, logout, children }) => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith('ar');
  
  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language, isRtl]);

  const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthPage = authPages.includes(location.pathname);
  const isNoLayoutPage = location.pathname.includes('-dashboard') || location.pathname.startsWith('/admin') || isAuthPage;

  return (
    <div className={`min-h-screen flex flex-col ${isNoLayoutPage ? 'bg-[#13151b]' : 'bg-gray-50'}`}>
      {!isNoLayoutPage && <Navbar user={user} logout={logout} />}
      <main className="flex-grow">
        {children}
      </main>
      {!isNoLayoutPage && <Footer />}
    </div>
  );
};

export default MainLayout;
