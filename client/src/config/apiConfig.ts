// Unified API configuration for mobile and desktop with dev flag
const getWihyApiUrl = () => {
  // Check for explicit environment variable first (highest priority)
  if (process.env.REACT_APP_WIHY_API_URL) {
    return process.env.REACT_APP_WIHY_API_URL;
  }
  
  // Development flag - set to true to use local dev server, false for production
  const USE_LOCAL_DEV = process.env.REACT_APP_USE_LOCAL_API === 'true';
  
  // Check if we're on localhost (local development)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocalhost && USE_LOCAL_DEV) {
    // Local development with dev flag enabled - use localhost API with port
    return 'http://localhost:8000';
  } else {
    // Production/deployed OR dev flag disabled - use ml.wihy.ai (WIHY VHealth API)
    return 'https://ml.wihy.ai';
  }
};

// Add cache busting version
const CACHE_VERSION = ''; // Increment this after each deployment

// Environment configuration for API endpoints
export const API_CONFIG = {
  // WIHY API - Unified for mobile and desktop
  WIHY_API_URL: getWihyApiUrl(),
  
  // WIHY Auth API - Authentication service
  WIHY_AUTH_API_URL: process.env.REACT_APP_WIHY_AUTH_API_URL || 'http://wihy-auth-api.centralus.azurecontainer.io:5000',
} as const;

// Debug logging
console.log('🔍 API CONFIG DEBUG:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_WIHY_API_URL: process.env.REACT_APP_WIHY_API_URL,
  REACT_APP_WIHY_AUTH_API_URL: process.env.REACT_APP_WIHY_AUTH_API_URL,
  FINAL_WIHY_URL: API_CONFIG.WIHY_API_URL,
  FINAL_AUTH_URL: API_CONFIG.WIHY_AUTH_API_URL,
  HOSTNAME: window.location.hostname,
  IS_LOCALHOST: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  USE_LOCAL_DEV: process.env.REACT_APP_USE_LOCAL_API === 'true',
  CACHE_VERSION: CACHE_VERSION,
  DETECTION_REASON: process.env.REACT_APP_WIHY_API_URL ? 'ENV_VAR' : 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && process.env.REACT_APP_USE_LOCAL_API === 'true' ? 'LOCAL_DEV' : 'PRODUCTION_ML_WIHY_AI'
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
