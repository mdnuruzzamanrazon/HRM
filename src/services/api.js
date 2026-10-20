import axios from 'axios';

// Create Axios instance with default configurations
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true, // Important for sending/receiving HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to attach JWT token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor for handling global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If the server returns a 401, only trigger unauthorized logout if:
    // 1. The user was actually logged in (had an auth_token in localStorage)
    // 2. It is not an auth handshake endpoint like /auth/login, /auth/forgot-password, /auth/reset-password, /auth/verify-reset-code
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isPublicAuthRoute = 
        url.includes('/auth/login') || 
        url.includes('/auth/forgot-password') || 
        url.includes('/auth/reset-password') ||
        url.includes('/auth/verify-reset-code');

      if (!isPublicAuthRoute && localStorage.getItem('auth_token')) {
        localStorage.removeItem('auth_token');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
