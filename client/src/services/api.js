/**
 * API Service
 * Centralized API client for making HTTP requests to the server
 */
import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      // Clear auth data if unauthorized
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/setup') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  checkSetup: () => apiClient.get('/auth/check-setup'),
  setup: (data) => apiClient.post('/auth/setup', data),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  changePassword: (passwordData) => apiClient.post('/auth/change-password', passwordData)
};

// Users API
export const usersAPI = {
  getAll: () => apiClient.get('/users'),
  getUser: (id) => apiClient.get(`/users/${id}`),
  updateUser: (id, userData) => apiClient.put(`/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/users/${id}`)
};

// NUT Servers API
export const nutServersAPI = {
  getAll: () => apiClient.get('/nut-servers'),
  getServer: (id) => apiClient.get(`/nut-servers/${id}`),
  addServer: (serverData) => apiClient.post('/nut-servers', serverData),
  updateServer: (id, serverData) => apiClient.put(`/nut-servers/${id}`, serverData),
  deleteServer: (id) => apiClient.delete(`/nut-servers/${id}`),
  testConnection: (id) => apiClient.post(`/nut-servers/${id}/test`)
};

// UPS Systems API
export const upsSystemsAPI = {
  getAll: () => apiClient.get('/ups-systems'),
  getSystem: (id) => apiClient.get(`/ups-systems/${id}`),
  addSystem: (systemData) => apiClient.post('/ups-systems', systemData),
  updateSystem: (id, systemData) => apiClient.put(`/ups-systems/${id}`, systemData),
  updateNickname: (id, nickname) => apiClient.put(`/ups-systems/${id}/nickname`, { nickname }),
  deleteSystem: (id) => apiClient.delete(`/ups-systems/${id}`),
  getBatteryHistory: (id, limit) => apiClient.get(`/ups-systems/${id}/battery`, { params: { limit } }),
  recordBatteryCharge: (id, chargePercent) => apiClient.post(`/ups-systems/${id}/battery`, { chargePercent })
};

// Notifications API
export const notificationsAPI = {
  getSettings: () => apiClient.get('/notifications/settings'),
  updateSettings: (settings) => apiClient.post('/notifications/settings', settings),
  testDiscord: (webhookUrl) => apiClient.post('/notifications/test', { discord_webhook_url: webhookUrl }),
  testSlack: (webhookUrl) => apiClient.post('/notifications/test-slack', { slack_webhook_url: webhookUrl }),
  testEmail: (recipients) => apiClient.post('/notifications/test-email', { email_recipients: recipients }),
  getHistory: () => apiClient.get('/notifications/history'),
  sendUpsStatusNotification: (data) => apiClient.post('/notifications/ups-status', data)
};

// User Settings API
export const userSettingsAPI = {
  getSettings: () => apiClient.get('/user-settings'),
  updateSettings: (settings) => apiClient.post('/user-settings', settings)
};

// System API
export const systemAPI = {
  getVersion: () => apiClient.get('/system/version'),
  update: () => apiClient.post('/system/update')
};

export default {
  auth: authAPI,
  users: usersAPI,
  nutServers: nutServersAPI,
  upsSystems: upsSystemsAPI,
  notifications: notificationsAPI,
  userSettings: userSettingsAPI,
  system: systemAPI
};
