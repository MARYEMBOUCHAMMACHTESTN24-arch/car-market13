import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  
  if (!token || !userRole) {
    return <Navigate to="/login" replace />;
  }
  
  // Check single role requirement
  if (role && userRole !== role && userRole !== 'admin') {
    // Role mismatch: Redirect to their correct dashboard based on actual role
    const target = userRole === 'manager' ? '/manager-dashboard' : '/client-dashboard';
    return <Navigate to={target} replace />;
  }
  
  // Check multiple allowed roles
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const target = userRole === 'admin' ? '/admin-dashboard' : 
                   userRole === 'manager' ? '/manager-dashboard' : '/client-dashboard';
    return <Navigate to={target} replace />;
  }
  
  return children;
};

export default ProtectedRoute;
