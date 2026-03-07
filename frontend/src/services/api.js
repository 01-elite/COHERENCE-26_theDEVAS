import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Budget APIs
export const budgetAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  getFlow: (id) => api.get(`/budgets/${id}/flow`),
  getByDepartment: (deptId) => api.get(`/budgets/department/${deptId}`),
};

// Transaction APIs
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getByBudget: (budgetId) => api.get(`/transactions/budget/${budgetId}`),
  flag: (id, reason) => api.put(`/transactions/${id}/flag`, { flagReason: reason }),
};

// Analytics APIs
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getTrends: (params) => api.get('/analytics/trends', { params }),
  getDepartmentComparison: () => api.get('/analytics/department-comparison'),
  getUtilization: (params) => api.get('/analytics/utilization', { params }),
  getPredictions: () => api.get('/analytics/predictions'),
};

// Anomaly APIs
export const anomalyAPI = {
  getAll: (params) => api.get('/anomalies', { params }),
  getById: (id) => api.get(`/anomalies/${id}`),
  detect: (params) => api.get('/anomalies/detect', { params }),
  getHighRisk: () => api.get('/anomalies/high-risk'),
  getStats: () => api.get('/anomalies/stats'),
  getYearComparison: () => api.get('/anomalies/year-comparison'),
  update: (id, data) => api.put(`/anomalies/${id}`, data),
  resolve: (id, resolution) => api.put(`/anomalies/${id}/resolve`, { resolution }),
};

// AI APIs
export const aiAPI = {
  chat: (message, conversationHistory) => 
    api.post('/ai/chat', { message, conversationHistory }),
  analyze: (budgetId) => api.post('/ai/analyze', { budgetId }),
  generateInsights: (timeframe) => api.post('/ai/insights', { timeframe }),
  generateReport: (data) => api.post('/ai/report', data),
};

// District APIs
export const districtAPI = {
  getAll: (params) => api.get('/districts', { params }),
  getById: (id) => api.get(`/districts/${id}`),
  getMapData: () => api.get('/districts/map-data'),
  update: (id, data) => api.put(`/districts/${id}`, data),
};

export default api;
