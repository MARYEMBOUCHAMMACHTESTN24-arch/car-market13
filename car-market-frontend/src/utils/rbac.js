/**
 * RBAC Helper utilities
 */

export const hasRole = (user, role) => {
  if (!user || !user.role) return false;
  return user.role.toLowerCase() === role.toLowerCase();
};

export const hasPermission = (user, permission) => {
  if (!user) return false;
  
  // Admin bypasses all checks
  if (user.role && user.role.toLowerCase() === 'admin') return true;
  
  if (!user.permissions) return false;
  return user.permissions.includes(permission);
};

export const can = (user, permission) => hasPermission(user, permission);
export const is = (user, role) => hasRole(user, role);
