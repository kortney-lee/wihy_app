// Mobile-friendly API configuration
const getWihyApiUrl = () => {
  // Check for explicit environment variable first
  if (process.env.REACT_APP_WIHY_API_URL) {
    return process.env.REACT_APP_WIHY_API_URL;
  }
  
  // Detect mobile browser or remote access
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // If accessing from mobile or non-localhost, try to use the current host
  if (isMobile || !isLocalhost) {
    // Try to use the same host as the frontend with port 8000
    const currentHost = window.location.hostname;
    return `http://${currentHost}:8000`;
  }
  
  // Default to localhost for desktop development
  return 'http://localhost:8000';
};

// Environment configuration for API endpoints
export const API_CONFIG = {
  // WIHY API - Dynamic based on environment and device
  WIHY_API_URL: getWihyApiUrl(),
} as const;

// Debug logging with enhanced information
console.log('🔍 API CONFIG DEBUG:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_WIHY_API_URL: process.env.REACT_APP_WIHY_API_URL,
  FINAL_URL: API_CONFIG.WIHY_API_URL,
  USER_AGENT: navigator.userAgent,
  HOSTNAME: window.location.hostname,
  FULL_URL: window.location.href,
  IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  IS_LOCALHOST: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  DETECTION_REASON: process.env.REACT_APP_WIHY_API_URL ? 'ENV_VAR' : 
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
     (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) ? 'MOBILE_OR_REMOTE' : 'DESKTOP_LOCALHOST'
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