/**
 * API Service
 * Centralized axios instance with interceptors
 * Handles authentication and error responses
 */

import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants.js';

export const AUTH_EXPIRED_EVENT = 'bb:auth-expired';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let refreshPromise = null;

const isAuthEndpoint = (url = '') => {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh')
  );
};

const shouldAttemptRefresh = (error) => {
  const status = error.response?.status;
  const originalRequest = error.config || {};

  if (status !== 401) return false;
  if (originalRequest.__isRetryRequest) return false;
  if (originalRequest.skipAuthRefresh) return false;
  if (isAuthEndpoint(originalRequest.url || '')) return false;

  return true;
};

const notifyAuthExpired = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
};

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh', null, { skipAuthRefresh: true })
      .then((response) => response.data)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (shouldAttemptRefresh(error)) {
      try {
        await refreshAccessToken();
        const retryConfig = {
          ...error.config,
          __isRetryRequest: true,
        };
        return api(retryConfig);
      } catch (refreshError) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        notifyAuthExpired();
      }
    } else if (
      error.response?.status === 401 &&
      !error.config?.skipAuthRefresh &&
      !isAuthEndpoint(error.config?.url || '')
    ) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      notifyAuthExpired();
    }

    // Handle errors
    const errorMessage =
      error.response?.data?.message || error.message || 'An error occurred';

    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
      originalError: error,
    });
  }
);

export default api;
