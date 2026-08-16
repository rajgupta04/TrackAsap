import axios from 'axios';

// Primary and fallback API URLs
const PRIMARY_URL = import.meta.env.VITE_API_URL || '/api';
const FALLBACK_URLS = (import.meta.env.VITE_API_FALLBACK_URLS || '')
  .split(',')
  .map(u => u.trim())
  .filter(Boolean);

const ALL_URLS = [PRIMARY_URL, ...FALLBACK_URLS];

// Track which server is currently working
let activeBaseURL = PRIMARY_URL;
let healthCheckInProgress = false;

const api = axios.create({
  baseURL: activeBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout
});

// Request interceptor to add auth token + use active URL
api.interceptors.request.use(
  (config) => {
    config.baseURL = activeBaseURL;
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

// Try to find a working server from the fallback list
async function findWorkingServer() {
  if (healthCheckInProgress) return;
  healthCheckInProgress = true;

  for (const url of ALL_URLS) {
    try {
      await axios.get(`${url.replace(/\/api$/, '')}/health`, { timeout: 5000 });
      activeBaseURL = url;
      console.log(`✅ Switched to working server: ${url}`);
      healthCheckInProgress = false;
      return true;
    } catch {
      console.warn(`❌ Server unreachable: ${url}`);
    }
  }

  healthCheckInProgress = false;
  return false;
}

// Response interceptor for error handling + fallback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If network error or timeout and we haven't retried yet, try fallback
    if (
      !originalRequest._retried &&
      FALLBACK_URLS.length > 0 &&
      (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK')
    ) {
      originalRequest._retried = true;
      const found = await findWorkingServer();
      if (found) {
        originalRequest.baseURL = activeBaseURL;
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // Handle banned user
    if (error.response?.status === 403 && error.response?.data?.banned) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert('Your account has been banned. Please contact support if you believe this is a mistake.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
