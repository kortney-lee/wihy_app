// Environment configuration for API endpoints
export const API_CONFIG = {
  // WIHY API - Force localhost for development
  WIHY_API_URL: 'http://localhost:8000',
} as const;

// Debug logging
console.log('🔍 API CONFIG DEBUG:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_WIHY_API_URL: process.env.REACT_APP_WIHY_API_URL,
  FINAL_URL: API_CONFIG.WIHY_API_URL
});

// Dynamic endpoint helper functions
export const getApiEndpoint = (path: string = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${API_CONFIG.WIHY_API_URL}${cleanPath}`;
  console.log('🔍 API ENDPOINT DEBUG:', { path, cleanPath, baseURL: API_CONFIG.WIHY_API_URL, fullUrl });
  return fullUrl;
};

export const getWihyEndpoint = (path: string = '') => {
  return getApiEndpoint(path);
};

export default API_CONFIG;