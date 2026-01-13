// Shared API configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://ml.wihy.ai';
export const AUTH_BASE_URL = process.env.REACT_APP_AUTH_BASE_URL || 'https://auth.wihy.ai';

export const API_ENDPOINTS = {
  search: '/search',
  nutrition: '/nutrition',
  ask: '/ask',
  user: '/user',
  meals: '/meals',
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
  },
};

export const API_TIMEOUT = 30000; // 30 seconds
