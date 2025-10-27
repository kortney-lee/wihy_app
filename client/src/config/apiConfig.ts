// Environment configuration for API endpoints
export const API_CONFIG = {
  // WIHY API - Production endpoint
  WIHY_API_URL: process.env.REACT_APP_WIHY_API_URL || 'https://ml.wihy.ai',
} as const;

// Dynamic endpoint helper functions
export const getApiEndpoint = (path: string = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_CONFIG.WIHY_API_URL}${cleanPath}`;
};

export const getWihyEndpoint = (path: string = '') => {
  return getApiEndpoint(path);
};

export default API_CONFIG;