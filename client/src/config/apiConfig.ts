// Unified API configuration for mobile and desktop
const getWihyApiUrl = () => {
  // Check for explicit environment variable first (highest priority)
  if (process.env.REACT_APP_WIHY_API_URL) {
    return process.env.REACT_APP_WIHY_API_URL;
  }
  
  // Check if we're on localhost (local development)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocalhost) {
    // Local development - use localhost API with port
    return 'http://localhost:8000';
  } else {
    // Production/deployed - use ml.wihy without port (standard HTTPS)
    return 'https://ml.wihy';
  }
};

// Environment configuration for API endpoints
export const API_CONFIG = {
  // WIHY API - Unified for mobile and desktop
  WIHY_API_URL: getWihyApiUrl(),
} as const;

// Debug logging
console.log('🔍 API CONFIG DEBUG:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_WIHY_API_URL: process.env.REACT_APP_WIHY_API_URL,
  FINAL_URL: API_CONFIG.WIHY_API_URL,
  HOSTNAME: window.location.hostname,
  IS_LOCALHOST: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  DETECTION_REASON: process.env.REACT_APP_WIHY_API_URL ? 'ENV_VAR' : 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'LOCAL_DEV' : 'PRODUCTION_ML_WIHY'
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