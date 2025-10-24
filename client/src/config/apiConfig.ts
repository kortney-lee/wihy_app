// Environment configuration for API endpoints
export const API_CONFIG = {
  // WIHY Enhanced Model API - Production endpoint (ONLY ENDPOINT WE USE)
  WIHY_API_URL: process.env.REACT_APP_WIHY_API_URL || 'https://ml.wihy.ai',
} as const;

// WIHY Enhanced Model API endpoint (2,325 training examples active)
export const WIHY_API_ENDPOINT = `${API_CONFIG.WIHY_API_URL}/ask`;

// API Endpoints
export const WIHY_HEALTH_CHECK_URL = `${API_CONFIG.WIHY_API_URL}/health`;
export const WIHY_SCAN_IMAGE_URL = `${API_CONFIG.WIHY_API_URL}/wihy/scan-image`;
export const WIHY_SCAN_BARCODE_URL = `${API_CONFIG.WIHY_API_URL}/wihy/scan-barcode`;

// Legacy compatibility functions
export const getApiEndpoint = (path: string = '') => {
  return `${API_CONFIG.WIHY_API_URL}${path}`;
};

export const getWihyEndpoint = (path: string = '') => {
  return `${API_CONFIG.WIHY_API_URL}${path}`;
};

export const getEnhancedWihyEndpoint = (path: string = '') => {
  return `${API_CONFIG.WIHY_API_URL}${path}`;
};

export default API_CONFIG;