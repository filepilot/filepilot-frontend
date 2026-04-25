import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor: check expiry and attach JWT Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('filepilot_token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('filepilot_token');
        localStorage.removeItem('filepilot_user');
        if (window.location.pathname !== '/' && window.location.pathname !== '/register') {
          window.location.href = '/';
        }
        return Promise.reject(new Error('Token expired'));
      }
    } catch {
      // If token can't be decoded, let backend handle it
    }
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-retry on transient errors, auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Never retry cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('filepilot_token');
      localStorage.removeItem('filepilot_user');
      if (window.location.pathname !== '/' && window.location.pathname !== '/register') {
        window.location.href = '/';
      }
      return Promise.reject(error);
    }

    // Auto-retry once on transient errors — only for GETs, since retrying writes
    // (POST/PUT/DELETE) on a 5xx that already had a side effect can duplicate work.
    // Never retry 429: the server is asking us to back off, retrying immediately
    // makes the rate-limit picture worse.
    const config = error.config;
    if (config && !config._retried) {
      const status = error.response?.status;
      const isGet = (config.method || 'get').toLowerCase() === 'get';
      const isRetryable = isGet && (!status || status >= 500);
      if (isRetryable) {
        config._retried = true;
        await new Promise(r => setTimeout(r, 500));
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
