import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Cars from './pages/Cars';
import CarDetails from './pages/CarDetails';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import About from './pages/About';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogDetails from './pages/BlogDetails';
import TipDetail from './pages/TipDetail';
import OffersPage from './pages/OffersPage';
import AdminDashboard from './pages/AdminDashboard';
import Invoice from './pages/Invoice';
import DashboardOrders from './pages/DashboardOrders';
import MyOrders from './pages/MyOrders';
import ClientDashboard from './pages/ClientDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import DashboardHome from './pages/DashboardHome';
import DashboardRequests from './pages/DashboardRequests';
import DashboardFavorites from './pages/DashboardFavorites';
import DashboardContact from './pages/DashboardContact';
import DashboardProfile from './pages/DashboardProfile';
import DashboardEditProfile from './pages/DashboardEditProfile';
import DashboardSettings from './pages/DashboardSettings';
import Recommendation from './pages/Recommendation';
import { authAPI } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();

  const clearStoredAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const response = await authAPI.getUser();
          const storedUser = JSON.parse(userData);
          const apiUser = response.data?.user || storedUser;
          const freshUser = {
            ...storedUser,
            ...apiUser,
            role: response.data?.role || apiUser.role || storedUser.role,
            permissions: response.data?.permissions || apiUser.permissions || storedUser.permissions || []
          };
          console.log('[profile avatar] authenticated user image url', freshUser.profile_image_url);
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
          localStorage.setItem('role', freshUser.role);
        } catch (error) {
          console.error('Failed to refresh authenticated user:', error);
          if (error.response?.status === 401 || error.response?.status === 403) {
            clearStoredAuth();
          } else {
            setUser(JSON.parse(userData));
          }
        }
      }

      // Initialize RTL based on current language
      const currentLang = i18n.language || localStorage.getItem('i18nextLng') || 'en';
      document.documentElement.dir = currentLang.startsWith('ar') ? 'rtl' : 'ltr';
      document.documentElement.lang = currentLang;

      setLoading(false);
    };

    initializeAuth();

    // Listen for language changes globally
    const handleLangChange = (lng) => {
      document.documentElement.dir = lng.startsWith('ar') ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
    };
    i18n.on('languageChanged', handleLangChange);

    return () => {
      i18n.off('languageChanged', handleLangChange);
    };
  }, [i18n]);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white font-medium text-lg">AutoMarket</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <MainLayout user={user} logout={logout}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/cars/:id" element={<CarDetails user={user} />} />
          <Route path="/car/:id" element={<CarDetails user={user} />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/promotions" element={<Navigate to="/offers" replace />} />
          <Route
            path="/checkout/:id"
            element={
              <ProtectedRoute>
                <Checkout user={user} />
              </ProtectedRoute>
            }
          />
          <Route path="/invoice/:id" element={<Invoice />} />
          <Route
            path="/login"
            element={user ? (
              <Navigate to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'manager' ? '/manager-dashboard' : '/client-dashboard'} />
            ) : <Login login={login} />}
          />
          <Route
            path="/register"
            element={user ? (
              <Navigate to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'manager' ? '/manager-dashboard' : '/client-dashboard'} />
            ) : <Register />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/client-dashboard"
            element={
              <ProtectedRoute role="client">
                <ClientDashboard user={user} logout={logout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome user={user} />} />
            <Route path="requests" element={<DashboardRequests user={user} />} />
            <Route path="orders" element={<MyOrders user={user} />} />
            <Route path="favorites" element={<DashboardFavorites />} />
            <Route path="contact" element={<DashboardContact user={user} />} />
            <Route path="profile" element={<DashboardProfile user={user} />} />
            <Route path="edit-profile" element={<DashboardEditProfile user={user} updateUser={updateUser} />} />
            <Route path="settings" element={<DashboardSettings />} />
          </Route>
          <Route
            path="/dashboard/profile"
            element={<Navigate to="/client-dashboard/profile" />}
          />
          <Route
            path="/dashboard/edit-profile"
            element={<Navigate to="/client-dashboard/edit-profile" />}
          />
          <Route
            path="/orders"
            element={<Navigate to="/client-dashboard/orders" />}
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <Navigate to="/client-dashboard" />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetails />} />
          <Route path="/tips/:slug" element={<TipDetail />} />
          <Route path="/recommend" element={<Recommendation />} />
          <Route path="/ai-advisor" element={<Recommendation />} />
          <Route
            path="/admin-dashboard/*"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager-dashboard/*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AdminDashboard user={user} />
              </ProtectedRoute>
            }
          />

          {/* Fallback for old routes */}
          <Route path="/admin/*" element={<Navigate to="/admin-dashboard" />} />
          <Route path="/dashboard/*" element={<Navigate to="/client-dashboard" />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
