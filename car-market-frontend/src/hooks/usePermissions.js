import { useState, useEffect } from 'react';

export const usePermissions = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse user from local storage');
      }
    }
  }, []);

  const hasPermission = (permissionName) => {
    if (!user) return false;
    
    // Root admins have full privileges implicitly
    if (user.role === 'admin') return true;

    // Managers need explicit permission checks
    if (!user.permissions || !Array.isArray(user.permissions)) return false;

    return user.permissions.some(p => {
      // Handle both object {name: 'xxx'} and string 'xxx' formats just in case
      const pName = typeof p === 'string' ? p : p.name;
      return pName === permissionName;
    });
  };

  return { user, hasPermission };
};

export default usePermissions;
