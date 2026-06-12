import axios from 'axios';

// Use relative URL so requests go through Vite proxy (localhost:5179 -> localhost:8000)
const API_BASE_URL = '/api';
const V2_API_BASE_URL = '/api/v2';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

export const v2API = axios.create({
  baseURL: V2_API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

const clearStoredAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
};

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Auth Error:', error.response?.status, error.response?.data?.message);
      if (error.response?.status === 401) {
        clearStoredAuth();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  initializeCsrf: async () => {
    // No-op for stateless API
  },
  login: async (credentials) => {
    try {
      return await api.post('/login', credentials);
    } catch (error) {
      if (error.response?.status === 419) {
        console.error('CSRF token mismatch detected at runtime');
      }
      console.warn('API login failed, falling back to local storage', error);
      // Fallback to local storage for presentation
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const user = users.find(u => u.email === credentials.email && u.password === credentials.password);

      if (user) {
        // Strip sensitive info
        const { password, ...safeUser } = user;
        return { data: { user: safeUser, token: 'mock-jwt-token-xyz-123' } };
      }

      throw error;
    }
  },
  register: async (userData) => {
    try {
      return await api.post('/register', userData);
    } catch (error) {
      console.warn('API registration failed, falling back to local storage', error);
      // Fallback to local storage for presentation
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');

      if (users.some(u => u.email === userData.email)) {
        throw { response: { data: { errors: { email: ['The email has already been taken.'] } } } };
      }

      const newUser = {
        id: Date.now(),
        ...userData,
        role: 'user',
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('mock_users', JSON.stringify(users));

      return { data: { user: newUser, message: 'Account created successfully (Local Fallback)' } };
    }
  },
  logout: () => api.post('/logout').catch(e => console.warn('Local logout', e)),
  getUser: () => api.get('/user'),
  updateProfile: (userData) => {
    if (userData instanceof FormData) {
      userData.append('_method', 'PATCH');
      return api.post('/user', userData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return api.patch('/user', userData);
  },
  forgotPassword: (data) => api.post('/forgot-password', data),
  resetPassword: (data) => api.post('/reset-password', data),
};

// Cars API
export const carsAPI = {
  getAll: (params = {}) => api.get('/cars', { params }),
  getFeatured: () => api.get('/cars/featured'),
  getAdmin: () => api.get('/cars/admin'),
  getPremium: () => api.get('/cars/premium'),
  togglePremium: (id, isPremium) => api.put(`/cars/${id}/premium`, { is_premium: isPremium }),
  getBrands: () => api.get('/brands'),
  getCategories: () => api.get('/categories'),
  getCities: () => api.get('/cities'),
  getById: (id) => api.get(`/cars/${id}`),
  create: (carData) => {
    return api.post('/cars', carData);
  },
  update: (id, carData) => {
    const isFormData = carData instanceof FormData;
    if (isFormData) {
      carData.append('_method', 'PUT');
      return api.post(`/cars/${id}`, carData);
    }
    return api.put(`/cars/${id}`, carData);
  },
  delete: (id) => api.delete(`/cars/${id}`),
};

// Offers API
export const offersAPI = {
  getActive: () => api.get('/offers'),
  getAdmin: () => api.get('/admin/offers'),
  create: (data) => {
    const isFormData = data instanceof FormData;
    return api.post('/admin/offers', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
  update: (id, data) => {
    const isFormData = data instanceof FormData;
    if (isFormData) {
      data.append('_method', 'PUT');
      return api.post(`/admin/offers/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/admin/offers/${id}`, data);
  },
  delete: (id) => api.delete(`/admin/offers/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: (params = {}) => api.get('/categories', { params }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => {
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      return api.post(`/categories/${id}`, data);
    }
    return api.put(`/categories/${id}`, data);
  },
  delete: (id) => api.delete(`/categories/${id}`),
};

// Favorites API
export const favoritesAPI = {
  getAll: () => api.get('/favorites'),
  add: (carId) => api.post(`/favorites/${carId}`),
  remove: (carId) => api.delete(`/favorites/${carId}`),
};


// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
};

// Orders API
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post('/orders', orderData),
  update: (id, orderData) => api.put(`/orders/${id}`, orderData),
  delete: (id) => api.delete(`/orders/${id}`),
  scheduleAppointment: (id, data) => api.put(`/orders/${id}/appointment`, data),
};

// Invoice API
export const facturesAPI = {
  getAll: () => api.get('/factures'),
  getById: (id) => api.get(`/factures/${id}`),
  generate: (orderId, data) => api.post(`/factures/generate/${orderId}`, data),
  updateStatus: (id, status) => api.put(`/factures/${id}/status`, { payment_status: status }),
  downloadPdf: (id, invoiceNumber) => {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/factures/${id}/pdf`;
    // Use fetch with auth header so we get the blob back
    return fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf',
      }
    })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob();
    })
    .then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Invoice-${invoiceNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    });
  },
};

export const invoicesAPI = {
  getAll: () => api.get('/invoices'),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (invoiceData) => api.post('/invoices', invoiceData),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const analyticsAPI = {
  getAnalytics: () => api.get('/analytics'),
  getDashboard: () => api.get('/analytics/dashboard'),
  getDashboardData: () => api.get('/analytics/dashboard'),
};

export const businessIntelligenceAPI = {
  getDashboard: () => api.get('/bi/dashboard'),
};

export const recommendationAPI = {
  recommend: (data) => api.post('/recommend', data),
};

export const aiAPI = {
  search: (data) => api.post('/ai/search', data),
  similarCars: (carId, limit = 8) => api.post('/ai/similar-cars', { car_id: carId, limit }),
  compare: (carIds) => api.post('/ai/compare', { car_ids: carIds }),
  track: (data) => api.post('/ai/track', data),
};

export const contactAPI = {
  send: (data) => api.post('/contact', data),
};

export const messagesAPI = {
  create: (data) => api.post('/messages', data),
  getAll: () => api.get('/messages'),
  getById: (id) => api.get(`/messages/${id}`),
  getConversation: (id) => api.get(`/messages/${id}/conversation`),
  getMyMessages: () => api.get('/my-messages'),
  getClientMessages: () => api.get('/client/messages'),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
  reply: (id, data) => api.post(`/messages/${id}/reply`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/messages/${id}`),
};

export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (data) => {
    const isFormData = data instanceof FormData;
    return api.post('/settings', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
};

export const adminsAPI = {
  getAll: () => api.get('/admins'),
  create: (data) => api.post('/admins', data),
  update: (id, data) => api.put(`/admins/${id}`, data),
  delete: (id) => api.delete(`/admins/${id}`),
  getPermissions: () => api.get('/permissions'),
  getRoles: () => api.get('/roles'),
};

export default api;
